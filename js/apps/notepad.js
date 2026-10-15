// NovaOS Text Editor (Notepad)
// Clean text editor with VFS file loading, saving, status bar, and shortcut support

class NotepadApp {
    constructor(container, windowData, initialFilePath = null) {
        this.container = container;
        this.win = windowData;
        this.currentFilePath = initialFilePath;
        this.isModified = false;

        this.initUI();
        if (initialFilePath) {
            this.loadFile(initialFilePath);
        }
    }

    initUI() {
        this.container.innerHTML = `
            <div class="notepad-wrapper">
                <div class="notepad-toolbar">
                    <button class="np-btn" id="np-new">📄 New</button>
                    <button class="np-btn" id="np-open">📂 Open</button>
                    <button class="np-btn" id="np-save">💾 Save</button>
                    <button class="np-btn" id="np-saveas">📝 Save As</button>
                    <span class="np-filepath" id="np-path-display">Untitled.txt</span>
                </div>
                <div class="notepad-editor-area">
                    <textarea class="notepad-textarea" spellcheck="false" placeholder="Start typing your document here..."></textarea>
                </div>
                <div class="notepad-statusbar">
                    <span id="np-status-mod">Saved</span>
                    <span id="np-status-chars">0 characters</span>
                    <span id="np-status-lines">1 lines</span>
                    <span>UTF-8</span>
                </div>
            </div>
        `;

        this.textarea = this.container.querySelector('.notepad-textarea');
        this.pathDisplay = this.container.querySelector('#np-path-display');
        this.modStatus = this.container.querySelector('#np-status-mod');
        this.charsStatus = this.container.querySelector('#np-status-chars');
        this.linesStatus = this.container.querySelector('#np-status-lines');

        // Buttons
        this.container.querySelector('#np-new').addEventListener('click', () => this.newFile());
        this.container.querySelector('#np-open').addEventListener('click', () => this.promptOpen());
        this.container.querySelector('#np-save').addEventListener('click', () => this.saveFile());
        this.container.querySelector('#np-saveas').addEventListener('click', () => this.saveAsPrompt());

        // Textarea changes
        this.textarea.addEventListener('input', () => {
            this.isModified = true;
            this.modStatus.textContent = '● Modified';
            this.modStatus.style.color = '#ff9800';
            this.updateStats();
        });

        // Ctrl+S shortcut inside textarea
        this.textarea.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveFile();
            }
        });

        this.updateStats();
    }

    updateStats() {
        const text = this.textarea.value;
        this.charsStatus.textContent = `${text.length} characters`;
        const lines = text.split('\n').length;
        this.linesStatus.textContent = `${lines} lines`;
    }

    newFile() {
        if (this.isModified && !confirm('Discard unsaved changes?')) return;
        this.textarea.value = '';
        this.currentFilePath = null;
        this.pathDisplay.textContent = 'Untitled.txt';
        this.isModified = false;
        this.modStatus.textContent = 'Saved';
        this.modStatus.style.color = 'inherit';
        this.updateStats();
    }

    loadFile(path) {
        try {
            const content = window.vfs.readFile(path);
            this.textarea.value = content;
            this.currentFilePath = path;
            this.pathDisplay.textContent = path;
            this.isModified = false;
            this.modStatus.textContent = 'Saved';
            this.modStatus.style.color = 'inherit';
            this.updateStats();
            this.win.element.querySelector('.window-title-text').textContent = `Notepad - ${path.split('/').pop()}`;
        } catch (e) {
            alert(`Error reading file: ${e.message}`);
        }
    }

    promptOpen() {
        const path = prompt('Enter file path to open:', this.currentFilePath || '/home/user/Desktop/Welcome.txt');
        if (path) {
            this.loadFile(path);
        }
    }

    saveFile() {
        if (!this.currentFilePath) {
            this.saveAsPrompt();
            return;
        }

        try {
            window.vfs.writeFile(this.currentFilePath, this.textarea.value);
            this.isModified = false;
            this.modStatus.textContent = 'Saved';
            this.modStatus.style.color = '#4caf50';
            if (window.soundEngine) window.soundEngine.playNotification();
            if (window.showToast) window.showToast(`Saved to ${this.currentFilePath}`);
        } catch (e) {
            alert(`Error saving file: ${e.message}`);
        }
    }

    saveAsPrompt() {
        const defaultName = this.currentFilePath || '/home/user/Documents/NewDocument.txt';
        const path = prompt('Save file as (full path):', defaultName);
        if (path) {
            this.currentFilePath = path;
            this.pathDisplay.textContent = path;
            this.saveFile();
            this.win.element.querySelector('.window-title-text').textContent = `Notepad - ${path.split('/').pop()}`;
        }
    }
}

window.NotepadApp = NotepadApp;
