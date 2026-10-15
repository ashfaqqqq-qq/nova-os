# 🌌 NovaOS Workstation v2.4 (Quantum Edition)

A high-performance, glassmorphic Web Operating System built completely in Vanilla JavaScript (ES6+), HTML5, and CSS3. Runs instantly in any modern web browser with **zero dependencies, no emulators, and no native compilation required**.

---

## 🚀 Quick Start

You can run NovaOS immediately using any of the following methods:

### Option 1: Direct File Launch (Fastest)
Double-click `index.html` in your file explorer, or right-click `index.html` -> **Open with Google Chrome / Microsoft Edge / Firefox**.

### Option 2: Local HTTP Server (Recommended)
From PowerShell in the `nova-os` directory:
```powershell
npx serve .
```
or with Python:
```powershell
python -m http.server 3000
```
Then open `http://localhost:3000` in your browser.

---

## 🌟 Key Features & Architecture

### 1. 🪟 Advanced Floating Window Manager (`windowManager.js`)
- **Interactive Drag & Resize**: Smooth dragging constrained to viewport and 8-direction resizing handles.
- **Window Controls**: Minimize to taskbar, Maximize to fullscreen with smooth restore, and Close with fade animations.
- **Z-Index Layering**: Intelligent focus hierarchy bringing active windows to front on click.
- **Taskbar Dock**: Running app tabs with active status dots, minimize/restore toggles, and "Show Desktop" peek button.

### 2. 💾 Persistent Virtual File System (`vfs.js`)
- **Unix-style Hierarchy**: Hierarchical folder tree (`/home/user/Desktop`, `/home/user/Documents`, `/home/user/Pictures`, `/bin`, `/etc`).
- **HTML5 Storage Persistence**: Any file created or modified in Notepad, Terminal, or File Manager automatically persists to browser `localStorage` across page reloads.
- **Safety**: Protected system directories with full path normalization (`.`, `..`, `/`).

### 3. 🔊 Synthesized Web Audio Engine (`audio.js`)
- Uses browser Web Audio API oscillators to generate real-time audio waveforms without needing external `.mp3` or `.wav` files.
- Includes **OS Startup Chimes**, tactile window clicks, notification tones, error buzzers, and 8-bit retro arcade blips.

### 4. 💻 Full-Featured Application Suite
- **Nova Terminal**:
  - Command interpreter with history navigation (`↑` / `↓`), Tab autocomplete.
  - Commands: `help`, `neofetch`, `matrix`, `ls`, `cd`, `pwd`, `cat`, `touch`, `mkdir`, `rm`, `echo`, `calc`, `whoami`, `date`, `beep`, `clear`, `reboot`.
- **File Explorer**:
  - Visual directory navigation, breadcrumb address bar, sidebar bookmarks (`Home`, `Desktop`, `Documents`, `Pictures`, `Bin`).
  - Create new files & folders, delete items, and double-click to launch files directly in Notepad.
- **Notepad**:
  - Text editor with Open, Save, and Save As directly linked to the Virtual File System.
  - Shortcut support (`Ctrl + S` to save) and character/line counter.
- **Calculator**:
  - Glassmorphic scientific & basic math engine with expression history and physical keyboard input.
- **System Monitor (Task Manager)**:
  - Real-time animated HTML5 Canvas telemetry showing live CPU load and RAM curves.
  - Active Process table with ability to kill processes (`End Task`).
- **Cyber Snake Arcade Game**:
  - Retro canvas game with score tracking, persistent high scores, and synthesized 8-bit sound effects.
- **Settings & Personalization**:
  - **Themes**: *Obsidian Dark*, *Cyberpunk Neon*, *Midnight Nebula*, *Arctic Aurora*.
  - **Wallpapers**: Procedural CSS gradient and cosmic radial mesh presets.
  - **Audio & Storage**: Master volume slider, sound toggle, and VFS factory reset.

---

## ⌨️ Global Shortcuts

| Shortcut | Action |
|---|---|
| `Win / Super` | Toggle Start Menu |
| `Ctrl + Alt + T` | Launch Terminal |
| `Ctrl + Shift + Esc` | Launch Task Manager |
| `Ctrl + S` *(inside Notepad)* | Save File to VFS |
| `Esc` | Close Start Menu / Context Menu |
| `Right Click on Desktop` | Custom Glassmorphic Context Menu |
