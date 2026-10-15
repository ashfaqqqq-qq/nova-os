// NovaOS Settings Application
// Personalization, themes, wallpapers, sound preferences, and VFS management

class SettingsApp {
    constructor(container, windowData) {
        this.container = container;
        this.win = windowData;

        this.initUI();
    }

    initUI() {
        const currentTheme = localStorage.getItem('nova_theme') || 'obsidian';
        const currentBg = localStorage.getItem('nova_bg') || 'nebula';
        const soundEnabled = window.soundEngine ? window.soundEngine.enabled : true;

        this.container.innerHTML = `
            <div class="settings-wrapper">
                <div class="settings-nav">
                    <button class="st-nav-item active" data-tab="appearance">🎨 Appearance</button>
                    <button class="st-nav-item" data-tab="sound">🔊 Audio</button>
                    <button class="st-nav-item" data-tab="storage">💾 Storage & VFS</button>
                    <button class="st-nav-item" data-tab="about">ℹ️ About NovaOS</button>
                </div>
                <div class="settings-content">
                    <!-- Appearance Tab -->
                    <div class="st-pane active" id="pane-appearance">
                        <h3>Theme Presets</h3>
                        <div class="st-theme-grid">
                            <div class="theme-card ${currentTheme === 'obsidian' ? 'selected' : ''}" data-theme="obsidian">
                                <div class="theme-preview th-obsidian"></div>
                                <span>Obsidian Dark</span>
                            </div>
                            <div class="theme-card ${currentTheme === 'cyberpunk' ? 'selected' : ''}" data-theme="cyberpunk">
                                <div class="theme-preview th-cyberpunk"></div>
                                <span>Cyberpunk Neon</span>
                            </div>
                            <div class="theme-card ${currentTheme === 'nebula' ? 'selected' : ''}" data-theme="nebula">
                                <div class="theme-preview th-nebula"></div>
                                <span>Midnight Nebula</span>
                            </div>
                            <div class="theme-card ${currentTheme === 'aurora' ? 'selected' : ''}" data-theme="aurora">
                                <div class="theme-preview th-aurora"></div>
                                <span>Arctic Aurora</span>
                            </div>
                        </div>

                        <h3 style="margin-top: 24px;">Desktop Wallpaper</h3>
                        <div class="st-wallpaper-grid">
                            <div class="wall-card ${currentBg === 'nebula' ? 'selected' : ''}" data-bg="nebula">
                                <div class="wall-thumb bg-thumb-nebula"></div>
                                <span>Cosmic Violet</span>
                            </div>
                            <div class="wall-card ${currentBg === 'synthwave' ? 'selected' : ''}" data-bg="synthwave">
                                <div class="wall-thumb bg-thumb-synthwave"></div>
                                <span>Neon Sunset</span>
                            </div>
                            <div class="wall-card ${currentBg === 'cyber' ? 'selected' : ''}" data-bg="cyber">
                                <div class="wall-thumb bg-thumb-cyber"></div>
                                <span>Deep Matrix</span>
                            </div>
                            <div class="wall-card ${currentBg === 'minimal' ? 'selected' : ''}" data-bg="minimal">
                                <div class="wall-thumb bg-thumb-minimal"></div>
                                <span>Minimal Dark</span>
                            </div>
                        </div>
                    </div>

                    <!-- Audio Tab -->
                    <div class="st-pane" id="pane-sound">
                        <h3>Audio Feedback</h3>
                        <div class="st-setting-row">
                            <div>
                                <div class="st-label">System Sound Effects</div>
                                <div class="st-sub">Synthesized window actions and notifications</div>
                            </div>
                            <input type="checkbox" id="st-sound-toggle" ${soundEnabled ? 'checked' : ''} />
                        </div>
                        <div class="st-setting-row">
                            <div>
                                <div class="st-label">Volume Level</div>
                                <div class="st-sub">Adjust master synthesized volume</div>
                            </div>
                            <input type="range" id="st-volume-slider" min="0" max="100" value="50" />
                        </div>
                        <button class="st-btn" id="st-test-sound">🎵 Test Startup Chime</button>
                    </div>

                    <!-- Storage Tab -->
                    <div class="st-pane" id="pane-storage">
                        <h3>Virtual File System Persistence</h3>
                        <p class="st-desc">NovaOS uses your browser's persistent HTML5 LocalStorage to maintain virtual files, documents, and configurations.</p>
                        
                        <div class="st-card">
                            <div class="st-label">Storage Allocation Status</div>
                            <div class="st-val" id="st-storage-size">Calculating...</div>
                        </div>

                        <div style="margin-top: 20px;">
                            <button class="st-btn danger" id="st-reset-vfs">⚠️ Reset Virtual File System to Defaults</button>
                        </div>
                    </div>

                    <!-- About Tab -->
                    <div class="st-pane" id="pane-about">
                        <h3>NovaOS Information</h3>
                        <div class="st-about-box">
                            <div class="st-about-logo">🌌</div>
                            <div>
                                <h4>NovaOS Workstation</h4>
                                <p>Version 2.4.0 (Quantum Edition)</p>
                                <p>Engine: Vanilla JS, Web Audio API, Canvas 2D, HTML5</p>
                                <p>Built for interactive browser computing without emulators or native setup.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Tab switching
        this.container.querySelectorAll('.st-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.st-nav-item').forEach(b => b.classList.remove('active'));
                this.container.querySelectorAll('.st-pane').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetPane = this.container.querySelector(`#pane-${btn.getAttribute('data-tab')}`);
                if (targetPane) targetPane.classList.add('active');
            });
        });

        // Theme switching
        this.container.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                this.container.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const theme = card.getAttribute('data-theme');
                if (window.setTheme) window.setTheme(theme);
            });
        });

        // Wallpaper switching
        this.container.querySelectorAll('.wall-card').forEach(card => {
            card.addEventListener('click', () => {
                this.container.querySelectorAll('.wall-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const bg = card.getAttribute('data-bg');
                if (window.setWallpaper) window.setWallpaper(bg);
            });
        });

        // Sound toggle
        const soundToggle = this.container.querySelector('#st-sound-toggle');
        soundToggle.addEventListener('change', () => {
            if (window.soundEngine) {
                window.soundEngine.enabled = soundToggle.checked;
            }
        });

        // Volume slider
        const volSlider = this.container.querySelector('#st-volume-slider');
        volSlider.addEventListener('input', () => {
            if (window.soundEngine) {
                window.soundEngine.setVolume(volSlider.value / 100);
            }
        });

        // Test sound
        this.container.querySelector('#st-test-sound').addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playStartup();
        });

        // Storage size
        const storageVal = this.container.querySelector('#st-storage-size');
        try {
            const raw = localStorage.getItem('nova_os_vfs_v1') || '';
            const kb = (raw.length * 2 / 1024).toFixed(2);
            storageVal.textContent = `${kb} KB used in LocalStorage`;
        } catch (e) {
            storageVal.textContent = 'Storage accessible';
        }

        // Reset VFS
        this.container.querySelector('#st-reset-vfs').addEventListener('click', () => {
            if (confirm('Reset all virtual files and folders back to default? Any custom files you created will be deleted.')) {
                if (window.vfs) {
                    window.vfs.reset();
                    if (window.showToast) window.showToast('VFS has been reset to defaults.');
                    this.initUI();
                }
            }
        });
    }
}

window.SettingsApp = SettingsApp;
