// NovaOS Terminal Application
// High-fidelity command-line interface with history, autocomplete, VFS integration, neofetch, and matrix mode

class TerminalApp {
    constructor(container, windowData) {
        this.container = container;
        this.win = windowData;
        this.cwd = '/home/user';
        this.history = [];
        this.historyIndex = -1;
        this.matrixInterval = null;

        this.initUI();
    }

    initUI() {
        this.container.innerHTML = `
            <div class="terminal-wrapper">
                <div class="terminal-output"></div>
                <div class="terminal-input-row">
                    <span class="terminal-prompt">user@nova-os:<span class="cwd-display">${this.cwd}</span>$ </span>
                    <input type="text" class="terminal-input" autofocus spellcheck="false" autocomplete="off" />
                </div>
            </div>
        `;

        this.outputEl = this.container.querySelector('.terminal-output');
        this.inputEl = this.container.querySelector('.terminal-input');
        this.cwdEl = this.container.querySelector('.cwd-display');

        // Initial welcome text in terminal
        this.printLine('NovaOS Shell v2.4 (x86_64-quantum-es2024)', 'term-info');
        this.printLine('Type <span class="term-highlight">help</span> to view available system commands or <span class="term-highlight">neofetch</span> for specs.\n');

        this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.container.addEventListener('click', () => this.inputEl.focus());
        this.inputEl.focus();

        // Hook window close to clean up any running matrix intervals
        const originalClose = this.win.onClose;
        this.win.onClose = () => {
            if (this.matrixInterval) clearInterval(this.matrixInterval);
            if (typeof originalClose === 'function') originalClose();
        };
    }

    printLine(html, className = '') {
        const line = document.createElement('div');
        line.className = `term-line ${className}`;
        line.innerHTML = html;
        this.outputEl.appendChild(line);
        this.container.scrollTop = this.container.scrollHeight;
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            const rawCmd = this.inputEl.value.trim();
            if (rawCmd) {
                this.history.push(rawCmd);
                this.historyIndex = this.history.length;
            }

            // Print the entered command
            this.printLine(`user@nova-os:${this.cwd}$ ${this.escapeHtml(this.inputEl.value)}`, 'term-cmd');
            this.inputEl.value = '';

            if (rawCmd) {
                this.executeCommand(rawCmd);
            }
            this.container.scrollTop = this.container.scrollHeight;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputEl.value = this.history[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.inputEl.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = this.history.length;
                this.inputEl.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.handleTabAutocomplete();
        }
    }

    handleTabAutocomplete() {
        const val = this.inputEl.value;
        const parts = val.split(' ');
        const target = parts[parts.length - 1];

        if (parts.length === 1) {
            // Autocomplete command
            const commands = ['help', 'clear', 'ls', 'cd', 'cat', 'mkdir', 'touch', 'rm', 'echo', 'neofetch', 'matrix', 'calc', 'date', 'whoami', 'reboot'];
            const matches = commands.filter(c => c.startsWith(target));
            if (matches.length === 1) {
                this.inputEl.value = matches[0] + ' ';
            }
        } else {
            // Autocomplete files in cwd
            try {
                const files = window.vfs.listDirectory(this.cwd);
                const matches = files.map(f => f.name).filter(n => n.startsWith(target));
                if (matches.length === 1) {
                    parts[parts.length - 1] = matches[0];
                    this.inputEl.value = parts.join(' ');
                }
            } catch (err) {}
        }
    }

    escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    executeCommand(cmdStr) {
        if (this.matrixInterval) {
            clearInterval(this.matrixInterval);
            this.matrixInterval = null;
        }

        const args = cmdStr.split(' ').filter(Boolean);
        const cmd = args[0].toLowerCase();
        const paramStr = cmdStr.substring(cmd.length).trim();

        switch (cmd) {
            case 'help':
                this.printLine(`Available Commands:
  <span class="term-cyan">neofetch</span>     - Display system info & ASCII logo
  <span class="term-cyan">ls [-la]</span>     - List files in current directory
  <span class="term-cyan">cd &lt;dir&gt;</span>     - Change current directory
  <span class="term-cyan">pwd</span>          - Print working directory
  <span class="term-cyan">cat &lt;file&gt;</span>    - Read file contents
  <span class="term-cyan">mkdir &lt;dir&gt;</span>   - Create a new directory
  <span class="term-cyan">touch &lt;file&gt;</span>   - Create an empty file
  <span class="term-cyan">echo &lt;txt&gt; [&gt; f]</span>- Output text or save to file
  <span class="term-cyan">rm &lt;path&gt;</span>     - Remove file or directory
  <span class="term-cyan">matrix</span>       - Digital rain animation (press any key to stop)
  <span class="term-cyan">calc &lt;expr&gt;</span>   - Calculate math expression
  <span class="term-cyan">whoami</span>       - Display logged in user
  <span class="term-cyan">date</span>         - Display current timestamp
  <span class="term-cyan">beep</span>         - Test audio engine
  <span class="term-cyan">clear</span>        - Clear terminal screen
  <span class="term-cyan">reboot</span>       - Reboot NovaOS`);
                break;

            case 'clear':
                this.outputEl.innerHTML = '';
                break;

            case 'pwd':
                this.printLine(this.cwd);
                break;

            case 'cd':
                const targetDir = args[1] || '/home/user';
                try {
                    const resolved = window.vfs.normalizePath(targetDir, this.cwd);
                    const node = window.vfs.getNode(resolved);
                    if (!node) {
                        this.printLine(`cd: no such file or directory: ${targetDir}`, 'term-err');
                    } else if (node.type !== 'dir') {
                        this.printLine(`cd: not a directory: ${targetDir}`, 'term-err');
                    } else {
                        this.cwd = resolved;
                        this.cwdEl.textContent = this.cwd;
                    }
                } catch (e) {
                    this.printLine(`cd: ${e.message}`, 'term-err');
                }
                break;

            case 'ls':
                try {
                    const target = args[1] && !args[1].startsWith('-') ? args[1] : this.cwd;
                    const items = window.vfs.listDirectory(target, this.cwd);
                    if (items.length === 0) {
                        this.printLine('<em>(empty directory)</em>', 'term-dim');
                    } else {
                        let out = '<div class="term-grid">';
                        items.forEach(item => {
                            const isDir = item.type === 'dir';
                            const icon = isDir ? '📁' : '📄';
                            const cls = isDir ? 'term-folder' : 'term-file';
                            out += `<span class="${cls}">${icon} ${item.name}</span>`;
                        });
                        out += '</div>';
                        this.printLine(out);
                    }
                } catch (e) {
                    this.printLine(`ls: ${e.message}`, 'term-err');
                }
                break;

            case 'cat':
                if (!args[1]) {
                    this.printLine('cat: missing filename', 'term-err');
                    return;
                }
                try {
                    const content = window.vfs.readFile(args[1], this.cwd);
                    this.printLine(`<pre class="term-pre">${this.escapeHtml(content)}</pre>`);
                } catch (e) {
                    this.printLine(`cat: ${e.message}`, 'term-err');
                }
                break;

            case 'mkdir':
                if (!args[1]) {
                    this.printLine('mkdir: missing operand', 'term-err');
                    return;
                }
                try {
                    window.vfs.createDirectory(args[1], this.cwd);
                    this.printLine(`Created directory: ${args[1]}`, 'term-success');
                } catch (e) {
                    this.printLine(`mkdir: ${e.message}`, 'term-err');
                }
                break;

            case 'touch':
                if (!args[1]) {
                    this.printLine('touch: missing file operand', 'term-err');
                    return;
                }
                try {
                    window.vfs.writeFile(args[1], '', this.cwd);
                    this.printLine(`Created file: ${args[1]}`, 'term-success');
                } catch (e) {
                    this.printLine(`touch: ${e.message}`, 'term-err');
                }
                break;

            case 'rm':
                if (!args[1]) {
                    this.printLine('rm: missing operand', 'term-err');
                    return;
                }
                try {
                    window.vfs.deleteEntry(args[1], this.cwd);
                    this.printLine(`Removed: ${args[1]}`, 'term-success');
                } catch (e) {
                    this.printLine(`rm: ${e.message}`, 'term-err');
                }
                break;

            case 'echo':
                const redirectMatch = paramStr.match(/(.*)\s*>\s*([^\s]+)$/);
                if (redirectMatch) {
                    const text = redirectMatch[1].trim().replace(/^['"]|['"]$/g, '');
                    const file = redirectMatch[2].trim();
                    try {
                        window.vfs.writeFile(file, text, this.cwd);
                        this.printLine(`Wrote to ${file}`, 'term-success');
                    } catch (e) {
                        this.printLine(`echo: ${e.message}`, 'term-err');
                    }
                } else {
                    this.printLine(this.escapeHtml(paramStr.replace(/^['"]|['"]$/g, '')));
                }
                break;

            case 'whoami':
                this.printLine('user (Security Level: Administrator)');
                break;

            case 'date':
                this.printLine(new Date().toString());
                break;

            case 'beep':
                if (window.soundEngine) {
                    window.soundEngine.playNotification();
                    this.printLine('*beep*', 'term-dim');
                }
                break;

            case 'calc':
                if (!paramStr) {
                    this.printLine('calc: please provide an arithmetic expression. e.g. calc 2 + 2 * 10', 'term-err');
                    return;
                }
                try {
                    // Safe basic math evaluator using Function with sanitized character check
                    if (!/^[0-9+\-*/().\s^%]+$/.test(paramStr)) {
                        throw new Error('Illegal characters in mathematical expression');
                    }
                    const result = Function(`'use strict'; return (${paramStr})`)();
                    this.printLine(`<span class="term-cyan">${paramStr}</span> = <span class="term-highlight">${result}</span>`);
                } catch (e) {
                    this.printLine(`calc error: ${e.message}`, 'term-err');
                }
                break;

            case 'neofetch':
                this.renderNeofetch();
                break;

            case 'matrix':
                this.renderMatrix();
                break;

            case 'reboot':
                this.printLine('Rebooting NovaOS system...', 'term-highlight');
                setTimeout(() => window.location.reload(), 1000);
                break;

            default:
                this.printLine(`command not found: ${cmd}. Type <span class="term-highlight">help</span> for command list.`, 'term-err');
                break;
        }
    }

    renderNeofetch() {
        const ascii = `
      /\\        <span class="term-cyan">user@nova-os</span>
     /  \\       -----------------------
    / /\\ \\      <span class="term-highlight">OS:</span> NovaOS v2.4.0 Quantum Edition
   / /  \\ \\     <span class="term-highlight">Kernel:</span> WebAssembly Hypervisor 6.1
  / / /\\ \\ \\    <span class="term-highlight">Uptime:</span> System active
 / / /  \\ \\ \\   <span class="term-highlight">Shell:</span> NovaSH 2.4 (Interactive)
/_/_/    \\_\\_\\  <span class="term-highlight">WM:</span> Nova Glass Window Manager
                <span class="term-highlight">Theme:</span> Obsidian Frost Glass
                <span class="term-highlight">Memory:</span> 16.0 GB (Allocated)
                <span class="term-highlight">VFS:</span> Persistent HTML5 LocalStorage
`;
        this.printLine(`<pre class="term-pre term-neofetch">${ascii}</pre>`);
    }

    renderMatrix() {
        this.printLine('Entering Matrix mode... (type any command to return)', 'term-success');
        const chars = '0123456789ABCDEF@#$%&*+=-~';
        let count = 0;

        this.matrixInterval = setInterval(() => {
            count++;
            if (count > 25) {
                clearInterval(this.matrixInterval);
                this.matrixInterval = null;
                return;
            }
            let line = '';
            for (let i = 0; i < 48; i++) {
                line += chars[Math.floor(Math.random() * chars.length)] + ' ';
            }
            this.printLine(line, 'term-matrix');
        }, 120);
    }
}

window.TerminalApp = TerminalApp;
