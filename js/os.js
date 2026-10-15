// NovaOS Core Operating System Architecture
// Coordinates boot lifecycle, app registry, desktop shell, start menu, system tray, and events

const APP_REGISTRY = {
    terminal: {
        id: 'terminal',
        title: 'Nova Terminal',
        icon: '💻',
        width: 680,
        height: 430,
        create: (container, win, args) => new TerminalApp(container, win)
    },
    fileManager: {
        id: 'fileManager',
        title: 'File Explorer',
        icon: '📁',
        width: 720,
        height: 480,
        create: (container, win, args) => new FileManagerApp(container, win, args?.initialPath)
    },
    notepad: {
        id: 'notepad',
        title: 'Notepad',
        icon: '📄',
        width: 620,
        height: 450,
        create: (container, win, args) => new NotepadApp(container, win, args?.filePath)
    },
    calculator: {
        id: 'calculator',
        title: 'Calculator',
        icon: '🔢',
        width: 320,
        height: 460,
        create: (container, win, args) => new CalculatorApp(container, win)
    },
    taskManager: {
        id: 'taskManager',
        title: 'System Monitor',
        icon: '📊',
        width: 620,
        height: 450,
        create: (container, win, args) => new TaskManagerApp(container, win)
    },
    snake: {
        id: 'snake',
        title: 'Cyber Snake',
        icon: '🐍',
        width: 440,
        height: 520,
        create: (container, win, args) => new SnakeGameApp(container, win)
    },
    settings: {
        id: 'settings',
        title: 'Settings',
        icon: '⚙️',
        width: 640,
        height: 460,
        create: (container, win, args) => new SettingsApp(container, win)
    }
};

class NovaOS {
    constructor() {
        this.startMenuOpen = false;
        this.contextMenu = null;
    }

    init() {
        // Initialize Window Manager
        window.windowManager.init();

        // Setup Desktop Icons
        this.renderDesktopIcons();

        // Setup Taskbar & Start Menu
        this.setupTaskbar();
        this.setupStartMenu();

        // Setup System Tray
        this.setupSystemTray();

        // Setup Desktop Context Menu
        this.setupContextMenu();

        // Setup Global Keyboard Shortcuts
        this.setupShortcuts();

        // Setup Global Launch Helper
        window.launchApp = (appId, args) => this.launchApp(appId, args);
        window.showToast = (msg, type) => this.showToast(msg, type);
        window.setTheme = (theme) => this.setTheme(theme);
        window.setWallpaper = (bg) => this.setWallpaper(bg);

        // Load saved theme and wallpaper
        this.loadPreferences();

        // Simulate Boot Screen Sequence
        this.bootSequence();
    }

    bootSequence() {
        const bootScreen = document.getElementById('boot-screen');
        const bootBar = document.getElementById('boot-progress-bar');
        const bootText = document.getElementById('boot-status-text');

        let progress = 0;
        const steps = [
            { pct: 25, txt: 'Loading Nova Hypervisor Kernel...' },
            { pct: 55, txt: 'Initializing Virtual File System...' },
            { pct: 85, txt: 'Starting Glass Window Manager & Daemons...' },
            { pct: 100, txt: 'Ready.' }
        ];

        let stepIndex = 0;
        const interval = setInterval(() => {
            if (stepIndex < steps.length) {
                progress = steps[stepIndex].pct;
                bootBar.style.width = `${progress}%`;
                bootText.textContent = steps[stepIndex].txt;
                stepIndex++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    bootScreen.classList.add('fade-out');
                    setTimeout(() => {
                        bootScreen.style.display = 'none';
                        if (window.soundEngine) window.soundEngine.playStartup();
                        this.showToast('Welcome to NovaOS! Double-click any icon to start.');
                    }, 500);
                }, 300);
            }
        }, 320);
    }

    launchApp(appId, args = {}) {
        const app = APP_REGISTRY[appId];
        if (!app) {
            console.error(`Unknown app: ${appId}`);
            return;
        }

        if (this.startMenuOpen) {
            this.toggleStartMenu(false);
        }

        let winTitle = app.title;
        if (appId === 'notepad' && args.filePath) {
            winTitle = `Notepad - ${args.filePath.split('/').pop()}`;
        }

        return window.windowManager.createWindow({
            appId: app.id,
            title: winTitle,
            icon: app.icon,
            width: app.width,
            height: app.height,
            onOpen: (container, win) => app.create(container, win, args)
        });
    }

    renderDesktopIcons() {
        const grid = document.getElementById('desktop-icons');
        grid.innerHTML = '';

        const desktopApps = [
            { id: 'terminal', title: 'Terminal', icon: '💻' },
            { id: 'fileManager', title: 'Files', icon: '📁' },
            { id: 'notepad', title: 'Notepad', icon: '📄' },
            { id: 'calculator', title: 'Calculator', icon: '🔢' },
            { id: 'taskManager', title: 'Monitor', icon: '📊' },
            { id: 'snake', title: 'Cyber Snake', icon: '🐍' },
            { id: 'settings', title: 'Settings', icon: '⚙️' }
        ];

        desktopApps.forEach(item => {
            const el = document.createElement('div');
            el.className = 'desktop-icon-item';
            el.innerHTML = `
                <div class="desktop-icon-symbol">${item.icon}</div>
                <div class="desktop-icon-label">${item.title}</div>
            `;

            // Selection
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.desktop-icon-item').forEach(i => i.classList.remove('selected'));
                el.classList.add('selected');
            });

            // Double click to launch
            el.addEventListener('dblclick', () => {
                this.launchApp(item.id);
            });

            grid.appendChild(el);
        });

        // Click on background deselects icons
        document.getElementById('desktop-area').addEventListener('click', (e) => {
            if (e.target.closest('.desktop-icon-item') || e.target.closest('.os-window')) return;
            document.querySelectorAll('.desktop-icon-item').forEach(i => i.classList.remove('selected'));
            this.toggleStartMenu(false);
            this.hideContextMenu();
        });
    }

    setupTaskbar() {
        const startBtn = document.getElementById('start-button');
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.soundEngine) window.soundEngine.playClick();
            this.toggleStartMenu();
        });

        const showDesktopBtn = document.getElementById('show-desktop-btn');
        showDesktopBtn.addEventListener('click', () => {
            const windows = Array.from(window.windowManager.windows.values());
            const allMinimized = windows.every(w => w.isMinimized);

            windows.forEach(w => {
                if (allMinimized) {
                    window.windowManager.restore(w.id);
                } else {
                    window.windowManager.minimize(w.id);
                }
            });
        });
    }

    setupStartMenu() {
        const startMenu = document.getElementById('start-menu');
        const appsGrid = document.getElementById('start-apps-grid');
        const searchInput = document.getElementById('start-search-input');

        // Populate apps in start menu
        this.renderStartApps(appsGrid);

        // Search filter
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const items = appsGrid.querySelectorAll('.start-app-card');
            items.forEach(card => {
                const title = card.getAttribute('data-title').toLowerCase();
                card.style.display = title.includes(query) ? 'flex' : 'none';
            });
        });

        // Power buttons
        document.getElementById('start-restart-btn').addEventListener('click', () => {
            if (confirm('Reboot NovaOS?')) {
                window.location.reload();
            }
        });

        document.getElementById('start-shutdown-btn').addEventListener('click', () => {
            if (confirm('Shut down NovaOS?')) {
                document.body.innerHTML = `
                    <div style="background:#000; color:#444; width:100vw; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
                        <h2 style="color:#666;">NovaOS is safely shut down.</h2>
                        <button onclick="location.reload()" style="margin-top:20px; padding:10px 24px; background:#1e293b; color:#fff; border:1px solid #334155; border-radius:8px; cursor:pointer;">Turn On Power</button>
                    </div>
                `;
            }
        });
    }

    renderStartApps(container) {
        container.innerHTML = '';
        Object.values(APP_REGISTRY).forEach(app => {
            const card = document.createElement('div');
            card.className = 'start-app-card';
            card.setAttribute('data-title', app.title);
            card.innerHTML = `
                <div class="start-app-icon">${app.icon}</div>
                <div class="start-app-info">
                    <div class="start-app-name">${app.title}</div>
                    <div class="start-app-desc">${this.getAppSummary(app.id)}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                this.launchApp(app.id);
            });

            container.appendChild(card);
        });
    }

    getAppSummary(id) {
        switch (id) {
            case 'terminal': return 'Command interpreter & utilities';
            case 'fileManager': return 'Browse files and folders';
            case 'notepad': return 'Text and code editor';
            case 'calculator': return 'Arithmetic and calculations';
            case 'taskManager': return 'Telemetry and process control';
            case 'snake': return 'Retro 8-bit arcade game';
            case 'settings': return 'System preferences & themes';
            default: return 'System application';
        }
    }

    toggleStartMenu(forceState) {
        const startMenu = document.getElementById('start-menu');
        const startBtn = document.getElementById('start-button');

        this.startMenuOpen = forceState !== undefined ? forceState : !this.startMenuOpen;

        if (this.startMenuOpen) {
            startMenu.classList.add('open');
            startBtn.classList.add('active');
            document.getElementById('start-search-input').focus();
        } else {
            startMenu.classList.remove('open');
            startBtn.classList.remove('active');
        }
    }

    setupSystemTray() {
        const timeEl = document.getElementById('tray-time');
        const dateEl = document.getElementById('tray-date');

        const updateClock = () => {
            const now = new Date();
            let hours = now.getHours();
            const mins = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;

            timeEl.textContent = `${hours}:${mins} ${ampm}`;

            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const y = now.getFullYear();
            dateEl.textContent = `${m}/${d}/${y}`;
        };

        updateClock();
        setInterval(updateClock, 1000);

        // Audio tray toggle
        const audioTrayBtn = document.getElementById('tray-audio');
        audioTrayBtn.addEventListener('click', () => {
            if (window.soundEngine) {
                const state = window.soundEngine.toggleSound();
                audioTrayBtn.textContent = state ? '🔊' : '🔇';
                this.showToast(state ? 'Sound Unmuted' : 'Sound Muted');
            }
        });
    }

    setupContextMenu() {
        this.contextMenu = document.getElementById('custom-context-menu');

        document.getElementById('desktop-area').addEventListener('contextmenu', (e) => {
            if (e.target.closest('.os-window')) return; // allow standard behavior inside windows
            e.preventDefault();

            if (window.soundEngine) window.soundEngine.playClick();

            const x = Math.min(e.clientX, window.innerWidth - 220);
            const y = Math.min(e.clientY, window.innerHeight - 240);

            this.contextMenu.style.left = `${x}px`;
            this.contextMenu.style.top = `${y}px`;
            this.contextMenu.style.display = 'block';
        });

        // Close context menu on outside click
        document.addEventListener('click', () => this.hideContextMenu());

        // Context menu item actions
        document.getElementById('cm-new-doc').addEventListener('click', () => {
            const name = prompt('Enter document name:', 'NewDocument.txt');
            if (name) {
                try {
                    window.vfs.writeFile(`/home/user/Desktop/${name}`, '');
                    this.showToast(`Created /home/user/Desktop/${name}`);
                } catch (err) {
                    alert(err.message);
                }
            }
        });

        document.getElementById('cm-open-term').addEventListener('click', () => {
            this.launchApp('terminal');
        });

        document.getElementById('cm-wallpaper').addEventListener('click', () => {
            this.launchApp('settings');
        });

        document.getElementById('cm-refresh').addEventListener('click', () => {
            this.renderDesktopIcons();
            this.showToast('Desktop Refreshed');
        });

        document.getElementById('cm-about').addEventListener('click', () => {
            this.launchApp('settings');
        });
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    }

    setupShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Super / Windows key opens Start Menu
            if (e.key === 'Meta') {
                this.toggleStartMenu();
            }

            // Ctrl+Alt+T opens Terminal
            if (e.ctrlKey && e.altKey && (e.key === 't' || e.key === 'T')) {
                e.preventDefault();
                this.launchApp('terminal');
            }

            // Ctrl+Shift+Escape opens Task Manager
            if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
                e.preventDefault();
                this.launchApp('taskManager');
            }

            // Escape closes Start Menu and Context Menu
            if (e.key === 'Escape') {
                this.toggleStartMenu(false);
                this.hideContextMenu();
            }
        });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `os-toast ${type} animate-slide-up`;
        toast.innerHTML = `
            <span class="toast-icon">✨</span>
            <span class="toast-text">${message}</span>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3500);
    }

    setTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('nova_theme', themeName);
        this.showToast(`Theme updated to ${themeName}`);
    }

    setWallpaper(bgName) {
        document.body.setAttribute('data-bg', bgName);
        localStorage.setItem('nova_bg', bgName);
        this.showToast('Wallpaper updated');
    }

    loadPreferences() {
        const savedTheme = localStorage.getItem('nova_theme') || 'obsidian';
        const savedBg = localStorage.getItem('nova_bg') || 'nebula';
        document.body.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-bg', savedBg);
    }
}

// Instantiate and Boot NovaOS once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.novaOS = new NovaOS();
    window.novaOS.init();
});
