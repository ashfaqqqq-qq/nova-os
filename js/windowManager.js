// NovaOS Window Manager
// Manages floating, draggable, resizable windows, taskbar items, and z-index ordering

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindowId = null;
        this.topZIndex = 100;
        this.windowCounter = 0;
        this.desktop = null;
        this.taskbarApps = null;
    }

    init() {
        this.desktop = document.getElementById('desktop-area');
        this.taskbarApps = document.getElementById('taskbar-apps');
    }

    createWindow(config) {
        this.windowCounter++;
        const id = `win-${config.appId || 'app'}-${this.windowCounter}`;

        // Play subtle open sound
        if (window.soundEngine) {
            window.soundEngine.playClick();
        }

        const width = config.width || 640;
        const height = config.height || 420;

        // Cascade window positioning slightly
        const cascadeOffset = (this.windowCounter % 8) * 25;
        const desktopWidth = this.desktop.clientWidth || window.innerWidth;
        const desktopHeight = this.desktop.clientHeight || window.innerHeight;

        const left = Math.max(20, Math.min(desktopWidth - width - 20, 80 + cascadeOffset));
        const top = Math.max(20, Math.min(desktopHeight - height - 60, 40 + cascadeOffset));

        // Create Window DOM
        const winEl = document.createElement('div');
        winEl.id = id;
        winEl.className = 'os-window glass-panel animate-pop-in';
        winEl.style.width = `${width}px`;
        winEl.style.height = `${height}px`;
        winEl.style.left = `${left}px`;
        winEl.style.top = `${top}px`;
        winEl.style.zIndex = ++this.topZIndex;

        winEl.innerHTML = `
            <div class="window-titlebar">
                <div class="window-title-left">
                    <span class="window-icon">${config.icon || '💻'}</span>
                    <span class="window-title-text">${config.title || 'Application'}</span>
                </div>
                <div class="window-controls">
                    <button class="win-btn win-minimize" title="Minimize">
                        <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" fill="currentColor"/></svg>
                    </button>
                    <button class="win-btn win-maximize" title="Maximize">
                        <svg width="10" height="10" viewBox="0 0 10 10"><rect width="9" height="9" x="0.5" y="0.5" fill="none" stroke="currentColor"/></svg>
                    </button>
                    <button class="win-btn win-close" title="Close">
                        <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5"/></svg>
                    </button>
                </div>
            </div>
            <div class="window-content">${config.content || ''}</div>
            
            <!-- Resizing Handles -->
            <div class="resize-handle res-n"></div>
            <div class="resize-handle res-s"></div>
            <div class="resize-handle res-e"></div>
            <div class="resize-handle res-w"></div>
            <div class="resize-handle res-nw"></div>
            <div class="resize-handle res-ne"></div>
            <div class="resize-handle res-sw"></div>
            <div class="resize-handle res-se"></div>
        `;

        this.desktop.appendChild(winEl);

        // Create Taskbar Item
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item active';
        taskbarItem.title = config.title;
        taskbarItem.innerHTML = `
            <span class="taskbar-item-icon">${config.icon || '💻'}</span>
            <span class="taskbar-item-title">${config.title}</span>
            <div class="taskbar-active-dot"></div>
        `;

        this.taskbarApps.appendChild(taskbarItem);

        const winData = {
            id,
            appId: config.appId,
            title: config.title,
            icon: config.icon,
            element: winEl,
            taskbarItem: taskbarItem,
            isMinimized: false,
            isMaximized: false,
            prevBounds: null,
            onClose: config.onClose,
            instance: null
        };

        this.windows.set(id, winData);

        // Bind events
        this.setupWindowEvents(winData);
        this.bringToFront(id);

        if (typeof config.onOpen === 'function') {
            winData.instance = config.onOpen(winEl.querySelector('.window-content'), winData);
        }

        return winData;
    }

    setupWindowEvents(winData) {
        const { id, element, taskbarItem } = winData;
        const titlebar = element.querySelector('.window-titlebar');
        const minBtn = element.querySelector('.win-minimize');
        const maxBtn = element.querySelector('.win-maximize');
        const closeBtn = element.querySelector('.win-close');

        // Focus on click
        element.addEventListener('mousedown', () => {
            this.bringToFront(id);
        });

        // Taskbar click toggles minimize / restore
        taskbarItem.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            if (this.activeWindowId === id && !winData.isMinimized) {
                this.minimize(id);
            } else {
                this.restore(id);
                this.bringToFront(id);
            }
        });

        // Window controls
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.soundEngine) window.soundEngine.playClick();
            this.minimize(id);
        });

        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.soundEngine) window.soundEngine.playClick();
            this.toggleMaximize(id);
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.soundEngine) window.soundEngine.playClick();
            this.close(id);
        });

        // Double click titlebar to maximize/restore
        titlebar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.win-btn')) return;
            this.toggleMaximize(id);
        });

        // Dragging
        this.setupDrag(titlebar, element, winData);

        // Resizing
        this.setupResize(element, winData);
    }

    setupDrag(dragHandle, windowEl, winData) {
        let isDragging = false;
        let startX, startY, origLeft, origTop;

        const onMouseDown = (e) => {
            if (e.target.closest('.win-btn') || winData.isMaximized) return;

            isDragging = true;
            this.bringToFront(winData.id);

            startX = e.clientX;
            startY = e.clientY;
            origLeft = windowEl.offsetLeft;
            origTop = windowEl.offsetTop;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newLeft = origLeft + dx;
            let newTop = origTop + dy;

            // Restrict bounds so window header doesn't escape top
            newTop = Math.max(0, newTop);

            windowEl.style.left = `${newLeft}px`;
            windowEl.style.top = `${newTop}px`;
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        dragHandle.addEventListener('mousedown', onMouseDown);
    }

    setupResize(windowEl, winData) {
        const handles = windowEl.querySelectorAll('.resize-handle');
        const minW = 280;
        const minH = 180;

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (winData.isMaximized) return;
                e.stopPropagation();
                e.preventDefault();

                this.bringToFront(winData.id);

                const direction = Array.from(handle.classList)
                    .find(c => c.startsWith('res-'))
                    .replace('res-', '');

                const startX = e.clientX;
                const startY = e.clientY;
                const startW = windowEl.offsetWidth;
                const startH = windowEl.offsetHeight;
                const startLeft = windowEl.offsetLeft;
                const startTop = windowEl.offsetTop;

                const onResizeMove = (moveEvt) => {
                    const dx = moveEvt.clientX - startX;
                    const dy = moveEvt.clientY - startY;

                    if (direction.includes('e')) {
                        const newW = Math.max(minW, startW + dx);
                        windowEl.style.width = `${newW}px`;
                    }
                    if (direction.includes('s')) {
                        const newH = Math.max(minH, startH + dy);
                        windowEl.style.height = `${newH}px`;
                    }
                    if (direction.includes('w')) {
                        const newW = Math.max(minW, startW - dx);
                        if (newW > minW) {
                            windowEl.style.width = `${newW}px`;
                            windowEl.style.left = `${startLeft + dx}px`;
                        }
                    }
                    if (direction.includes('n')) {
                        const newH = Math.max(minH, startH - dy);
                        if (newH > minH) {
                            windowEl.style.height = `${newH}px`;
                            windowEl.style.top = `${Math.max(0, startTop + dy)}px`;
                        }
                    }
                };

                const onResizeUp = () => {
                    document.removeEventListener('mousemove', onResizeMove);
                    document.removeEventListener('mouseup', onResizeUp);
                };

                document.addEventListener('mousemove', onResizeMove);
                document.addEventListener('mouseup', onResizeUp);
            });
        });
    }

    bringToFront(id) {
        const winData = this.windows.get(id);
        if (!winData) return;

        this.topZIndex++;
        winData.element.style.zIndex = this.topZIndex;
        this.activeWindowId = id;

        // Update active classes
        this.windows.forEach((w) => {
            w.element.classList.toggle('active', w.id === id);
            w.taskbarItem.classList.toggle('active', w.id === id);
        });
    }

    minimize(id) {
        const winData = this.windows.get(id);
        if (!winData) return;

        winData.isMinimized = true;
        winData.element.classList.add('minimized');
        winData.taskbarItem.classList.remove('active');

        if (this.activeWindowId === id) {
            // Find another non-minimized window to focus
            const candidates = Array.from(this.windows.values())
                .filter(w => !w.isMinimized && w.id !== id)
                .sort((a, b) => parseInt(b.element.style.zIndex) - parseInt(a.element.style.zIndex));

            if (candidates.length > 0) {
                this.bringToFront(candidates[0].id);
            } else {
                this.activeWindowId = null;
            }
        }
    }

    restore(id) {
        const winData = this.windows.get(id);
        if (!winData) return;

        winData.isMinimized = false;
        winData.element.classList.remove('minimized');
        this.bringToFront(id);
    }

    toggleMaximize(id) {
        const winData = this.windows.get(id);
        if (!winData) return;

        if (winData.isMaximized) {
            // Restore previous bounds
            winData.isMaximized = false;
            winData.element.classList.remove('maximized');
            if (winData.prevBounds) {
                winData.element.style.left = `${winData.prevBounds.left}px`;
                winData.element.style.top = `${winData.prevBounds.top}px`;
                winData.element.style.width = `${winData.prevBounds.width}px`;
                winData.element.style.height = `${winData.prevBounds.height}px`;
            }
        } else {
            // Save current bounds
            winData.prevBounds = {
                left: winData.element.offsetLeft,
                top: winData.element.offsetTop,
                width: winData.element.offsetWidth,
                height: winData.element.offsetHeight
            };
            winData.isMaximized = true;
            winData.element.classList.add('maximized');
        }
    }

    close(id) {
        const winData = this.windows.get(id);
        if (!winData) return;

        if (typeof winData.onClose === 'function') {
            winData.onClose(winData);
        }

        winData.element.classList.add('animate-close');
        setTimeout(() => {
            if (winData.element && winData.element.parentNode) {
                winData.element.parentNode.removeChild(winData.element);
            }
            if (winData.taskbarItem && winData.taskbarItem.parentNode) {
                winData.taskbarItem.parentNode.removeChild(winData.taskbarItem);
            }
            this.windows.delete(id);

            // Re-focus remaining top window
            if (this.activeWindowId === id) {
                const candidates = Array.from(this.windows.values())
                    .filter(w => !w.isMinimized)
                    .sort((a, b) => parseInt(b.element.style.zIndex) - parseInt(a.element.style.zIndex));

                if (candidates.length > 0) {
                    this.bringToFront(candidates[0].id);
                } else {
                    this.activeWindowId = null;
                }
            }
        }, 150);
    }

    getRunningApps() {
        return Array.from(this.windows.values()).map(w => ({
            id: w.id,
            appId: w.appId,
            title: w.title,
            isMinimized: w.isMinimized
        }));
    }
}

window.windowManager = new WindowManager();
