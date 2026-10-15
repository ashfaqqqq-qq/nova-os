// NovaOS Virtual File System (VFS)
// Supports Unix-like hierarchical file system, path navigation, and localStorage persistence

class VirtualFileSystem {
    constructor() {
        this.storageKey = 'nova_os_vfs_v1';
        this.root = this.load() || this.createDefaultFS();
    }

    createDefaultFS() {
        return {
            name: '/',
            type: 'dir',
            createdAt: Date.now(),
            children: {
                'bin': {
                    name: 'bin',
                    type: 'dir',
                    createdAt: Date.now(),
                    children: {
                        'sh': { name: 'sh', type: 'file', content: '#!/bin/sh NovaOS Shell', createdAt: Date.now() },
                        'ls': { name: 'ls', type: 'file', content: 'List directory contents', createdAt: Date.now() },
                        'cat': { name: 'cat', type: 'file', content: 'Concatenate and display files', createdAt: Date.now() },
                        'matrix': { name: 'matrix', type: 'file', content: 'Matrix digital rain effect', createdAt: Date.now() },
                        'neofetch': { name: 'neofetch', type: 'file', content: 'Display OS and system info', createdAt: Date.now() }
                    }
                },
                'etc': {
                    name: 'etc',
                    type: 'dir',
                    createdAt: Date.now(),
                    children: {
                        'hostname': { name: 'hostname', type: 'file', content: 'nova-system', createdAt: Date.now() },
                        'os-release': { name: 'os-release', type: 'file', content: 'NAME="NovaOS"\nVERSION="2.4.0-Quantum"\nARCH="WebAssembly/ES2024"', createdAt: Date.now() }
                    }
                },
                'home': {
                    name: 'home',
                    type: 'dir',
                    createdAt: Date.now(),
                    children: {
                        'user': {
                            name: 'user',
                            type: 'dir',
                            createdAt: Date.now(),
                            children: {
                                'Desktop': {
                                    name: 'Desktop',
                                    type: 'dir',
                                    createdAt: Date.now(),
                                    children: {
                                        'Welcome.txt': {
                                            name: 'Welcome.txt',
                                            type: 'file',
                                            content: `=========================================
          WELCOME TO NOVA OS v2.4
=========================================

Congratulations! Your virtual workstation is ready.

Features:
• Complete Window Manager (Drag, Resize, Minimize, Maximize)
• Virtual Terminal with full command interpreter
• Persistent File Explorer and Text Editor (Notepad)
• System Monitor with real-time CPU & Memory graphs
• Retro Arcade Game (Snake with WebAudio Sound Effects)
• Customizable themes & backgrounds in Settings

Try these terminal commands:
  - neofetch
  - matrix
  - ls -la
  - calc 15 * (4 + 6)
  - date

Files you create in Notepad or Terminal are saved directly
to your browser's persistent storage! Enjoy exploring!
`,
                                            createdAt: Date.now()
                                        },
                                        'Quick_Notes.txt': {
                                            name: 'Quick_Notes.txt',
                                            type: 'file',
                                            content: 'Todo for today:\n1. Check out the Terminal neofetch\n2. High score on Snake\n3. Try switching to Cyberpunk theme\n4. Write a script in Notepad',
                                            createdAt: Date.now()
                                        }
                                    }
                                },
                                'Documents': {
                                    name: 'Documents',
                                    type: 'dir',
                                    createdAt: Date.now(),
                                    children: {
                                        'Architecture.md': {
                                            name: 'Architecture.md',
                                            type: 'file',
                                            content: `# NovaOS Architecture
- Core: Vanilla JavaScript ES6+
- Window Engine: Virtual DOM-like floating state manager
- Audio: Synthesized Web Audio API oscillators
- Persistence: JSON-serialized Hierarchical VFS in Web Storage
- Graphics: Canvas 2D + Glassmorphic CSS3
`,
                                            createdAt: Date.now()
                                        },
                                        'Super_Secret.txt': {
                                            name: 'Super_Secret.txt',
                                            type: 'file',
                                            content: 'CLASSIFIED:\nThe matrix code terminal command is simply: matrix',
                                            createdAt: Date.now()
                                        }
                                    }
                                },
                                'Pictures': {
                                    name: 'Pictures',
                                    type: 'dir',
                                    createdAt: Date.now(),
                                    children: {
                                        'About_Wallpaper.txt': {
                                            name: 'About_Wallpaper.txt',
                                            type: 'file',
                                            content: 'You can change wallpapers in Settings or right click on Desktop!',
                                            createdAt: Date.now()
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.root));
        } catch (e) {
            console.error('Failed to save VFS to localStorage', e);
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load VFS', e);
        }
        return null;
    }

    reset() {
        localStorage.removeItem(this.storageKey);
        this.root = this.createDefaultFS();
        this.save();
    }

    // Split path into array of normalized segments
    normalizePath(path, cwd = '/home/user') {
        let fullPath = path.startsWith('/') ? path : `${cwd}/${path}`;
        const rawParts = fullPath.split('/').filter(Boolean);
        const resolvedParts = [];

        for (const part of rawParts) {
            if (part === '.') continue;
            if (part === '..') {
                resolvedParts.pop();
            } else {
                resolvedParts.push(part);
            }
        }

        return '/' + resolvedParts.join('/');
    }

    // Traverse to node given absolute path
    getNode(absolutePath) {
        if (absolutePath === '/' || absolutePath === '') {
            return this.root;
        }

        const parts = absolutePath.split('/').filter(Boolean);
        let curr = this.root;

        for (const part of parts) {
            if (!curr || curr.type !== 'dir' || !curr.children[part]) {
                return null;
            }
            curr = curr.children[part];
        }

        return curr;
    }

    // Read file content
    readFile(path, cwd = '/home/user') {
        const absPath = this.normalizePath(path, cwd);
        const node = this.getNode(absPath);
        if (!node) {
            throw new Error(`File not found: ${path}`);
        }
        if (node.type !== 'file') {
            throw new Error(`Is a directory: ${path}`);
        }
        return node.content;
    }

    // Write file content (creates if missing)
    writeFile(path, content, cwd = '/home/user') {
        const absPath = this.normalizePath(path, cwd);
        const lastSlash = absPath.lastIndexOf('/');
        const dirPath = absPath.substring(0, lastSlash) || '/';
        const fileName = absPath.substring(lastSlash + 1);

        if (!fileName) {
            throw new Error('Invalid file name');
        }

        const parentDir = this.getNode(dirPath);
        if (!parentDir || parentDir.type !== 'dir') {
            throw new Error(`Directory not found: ${dirPath}`);
        }

        if (parentDir.children[fileName] && parentDir.children[fileName].type === 'dir') {
            throw new Error(`Cannot overwrite directory with file: ${fileName}`);
        }

        parentDir.children[fileName] = {
            name: fileName,
            type: 'file',
            content: content,
            updatedAt: Date.now(),
            createdAt: parentDir.children[fileName] ? parentDir.children[fileName].createdAt : Date.now()
        };

        this.save();
        return true;
    }

    // Create a directory
    createDirectory(path, cwd = '/home/user') {
        const absPath = this.normalizePath(path, cwd);
        const lastSlash = absPath.lastIndexOf('/');
        const parentPath = absPath.substring(0, lastSlash) || '/';
        const dirName = absPath.substring(lastSlash + 1);

        if (!dirName) {
            throw new Error('Invalid directory name');
        }

        const parentNode = this.getNode(parentPath);
        if (!parentNode || parentNode.type !== 'dir') {
            throw new Error(`Parent directory does not exist: ${parentPath}`);
        }

        if (parentNode.children[dirName]) {
            throw new Error(`File or directory already exists: ${dirName}`);
        }

        parentNode.children[dirName] = {
            name: dirName,
            type: 'dir',
            createdAt: Date.now(),
            children: {}
        };

        this.save();
        return true;
    }

    // List contents of a directory
    listDirectory(path, cwd = '/home/user') {
        const absPath = this.normalizePath(path, cwd);
        const node = this.getNode(absPath);
        if (!node) {
            throw new Error(`Directory not found: ${path}`);
        }
        if (node.type !== 'dir') {
            throw new Error(`Not a directory: ${path}`);
        }

        return Object.values(node.children).map(item => ({
            name: item.name,
            type: item.type,
            size: item.type === 'file' ? item.content.length : Object.keys(item.children).length,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt || item.createdAt
        }));
    }

    // Delete a file or directory
    deleteEntry(path, cwd = '/home/user') {
        const absPath = this.normalizePath(path, cwd);
        if (absPath === '/' || absPath === '/home' || absPath === '/home/user') {
            throw new Error('Permission denied: cannot delete protected system directory');
        }

        const lastSlash = absPath.lastIndexOf('/');
        const parentPath = absPath.substring(0, lastSlash) || '/';
        const name = absPath.substring(lastSlash + 1);

        const parentNode = this.getNode(parentPath);
        if (!parentNode || !parentNode.children[name]) {
            throw new Error(`No such file or directory: ${path}`);
        }

        delete parentNode.children[name];
        this.save();
        return true;
    }
}

window.vfs = new VirtualFileSystem();
