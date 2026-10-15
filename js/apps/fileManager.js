// NovaOS File Manager (File Explorer)
// Visual file browser with navigation, file creation, deletion, and file launching

class FileManagerApp {
    constructor(container, windowData, initialPath = '/home/user') {
        this.container = container;
        this.win = windowData;
        this.currentPath = initialPath;
        this.history = [initialPath];
        this.historyIndex = 0;
        this.selectedItem = null;

        this.initUI();
        this.renderPath(this.currentPath);
    }

    initUI() {
        this.container.innerHTML = `
            <div class="fm-wrapper">
                <div class="fm-toolbar">
                    <button class="fm-nav-btn" id="fm-back" title="Back">◀</button>
                    <button class="fm-nav-btn" id="fm-up" title="Up One Level">▲</button>
                    <div class="fm-path-bar">
                        <span class="fm-path-icon">📂</span>
                        <input type="text" class="fm-path-input" id="fm-path-input" value="${this.currentPath}" />
                    </div>
                    <button class="fm-action-btn" id="fm-new-folder" title="New Folder">📁+ New Folder</button>
                    <button class="fm-action-btn" id="fm-new-file" title="New Text File">📄+ New File</button>
                    <button class="fm-action-btn danger" id="fm-delete" title="Delete">🗑 Delete</button>
                </div>
                <div class="fm-main-area">
                    <div class="fm-sidebar">
                        <div class="fm-sidebar-item" data-path="/home/user">🏠 User Home</div>
                        <div class="fm-sidebar-item" data-path="/home/user/Desktop">🖥 Desktop</div>
                        <div class="fm-sidebar-item" data-path="/home/user/Documents">📁 Documents</div>
                        <div class="fm-sidebar-item" data-path="/home/user/Pictures">🖼 Pictures</div>
                        <div class="fm-sidebar-item" data-path="/bin">⚙️ System Bin</div>
                    </div>
                    <div class="fm-content-grid" id="fm-grid"></div>
                </div>
                <div class="fm-statusbar">
                    <span id="fm-status-count">0 items</span>
                    <span id="fm-status-selected">No item selected</span>
                </div>
            </div>
        `;

        this.grid = this.container.querySelector('#fm-grid');
        this.pathInput = this.container.querySelector('#fm-path-input');
        this.backBtn = this.container.querySelector('#fm-back');
        this.upBtn = this.container.querySelector('#fm-up');
        this.statusCount = this.container.querySelector('#fm-status-count');
        this.statusSelected = this.container.querySelector('#fm-status-selected');

        // Events
        this.backBtn.addEventListener('click', () => this.navigateBack());
        this.upBtn.addEventListener('click', () => this.navigateUp());

        this.pathInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.navigateTo(this.pathInput.value.trim());
            }
        });

        // Sidebar quick links
        this.container.querySelectorAll('.fm-sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const p = item.getAttribute('data-path');
                this.navigateTo(p);
            });
        });

        // New folder
        this.container.querySelector('#fm-new-folder').addEventListener('click', () => {
            const name = prompt('Enter new folder name:');
            if (name) {
                try {
                    window.vfs.createDirectory(`${this.currentPath}/${name}`);
                    this.renderPath(this.currentPath);
                } catch (e) {
                    alert(e.message);
                }
            }
        });

        // New file
        this.container.querySelector('#fm-new-file').addEventListener('click', () => {
            const name = prompt('Enter new file name:', 'NewFile.txt');
            if (name) {
                try {
                    window.vfs.writeFile(`${this.currentPath}/${name}`, '');
                    this.renderPath(this.currentPath);
                } catch (e) {
                    alert(e.message);
                }
            }
        });

        // Delete
        this.container.querySelector('#fm-delete').addEventListener('click', () => {
            if (!this.selectedItem) {
                alert('Please select an item first');
                return;
            }
            if (confirm(`Are you sure you want to delete "${this.selectedItem.name}"?`)) {
                try {
                    window.vfs.deleteEntry(`${this.currentPath}/${this.selectedItem.name}`);
                    this.selectedItem = null;
                    this.renderPath(this.currentPath);
                } catch (e) {
                    alert(e.message);
                }
            }
        });
    }

    navigateTo(path, pushHistory = true) {
        try {
            const resolved = window.vfs.normalizePath(path);
            const node = window.vfs.getNode(resolved);
            if (!node || node.type !== 'dir') {
                alert(`Cannot open ${path}: Not a valid directory`);
                return;
            }

            this.currentPath = resolved;
            this.pathInput.value = resolved;
            this.selectedItem = null;

            if (pushHistory) {
                this.history = this.history.slice(0, this.historyIndex + 1);
                this.history.push(resolved);
                this.historyIndex = this.history.length - 1;
            }

            this.renderPath(resolved);
        } catch (e) {
            alert(e.message);
        }
    }

    navigateBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.navigateTo(this.history[this.historyIndex], false);
        }
    }

    navigateUp() {
        if (this.currentPath === '/') return;
        const lastSlash = this.currentPath.lastIndexOf('/');
        const parent = this.currentPath.substring(0, lastSlash) || '/';
        this.navigateTo(parent);
    }

    renderPath(path) {
        this.grid.innerHTML = '';
        try {
            const items = window.vfs.listDirectory(path);
            this.statusCount.textContent = `${items.length} items`;
            this.statusSelected.textContent = 'No item selected';

            if (items.length === 0) {
                this.grid.innerHTML = '<div class="fm-empty-hint">Folder is empty</div>';
                return;
            }

            // Sort folders first, then files alphabetically
            items.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'fm-grid-item';

                let icon = '📄';
                if (item.type === 'dir') icon = '📁';
                else if (item.name.endsWith('.md')) icon = '📝';
                else if (item.name.endsWith('.txt')) icon = '📄';
                else if (item.name.endsWith('.sh')) icon = '⚙️';
                else if (item.name.endsWith('.svg') || item.name.endsWith('.png')) icon = '🖼';

                el.innerHTML = `
                    <div class="fm-item-icon">${icon}</div>
                    <div class="fm-item-name" title="${item.name}">${item.name}</div>
                `;

                // Single click to select
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.container.querySelectorAll('.fm-grid-item').forEach(i => i.classList.remove('selected'));
                    el.classList.add('selected');
                    this.selectedItem = item;
                    this.statusSelected.textContent = `${item.name} (${item.type === 'file' ? item.size + ' B' : 'folder'})`;
                });

                // Double click to open
                el.addEventListener('dblclick', () => {
                    if (window.soundEngine) window.soundEngine.playClick();
                    if (item.type === 'dir') {
                        const next = this.currentPath === '/' ? `/${item.name}` : `${this.currentPath}/${item.name}`;
                        this.navigateTo(next);
                    } else {
                        // Open in Notepad
                        const filePath = this.currentPath === '/' ? `/${item.name}` : `${this.currentPath}/${item.name}`;
                        if (window.launchApp) {
                            window.launchApp('notepad', { filePath });
                        }
                    }
                });

                this.grid.appendChild(el);
            });
        } catch (e) {
            this.grid.innerHTML = `<div class="fm-empty-hint error">${e.message}</div>`;
        }
    }
}

window.FileManagerApp = FileManagerApp;
