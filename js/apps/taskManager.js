// NovaOS System Monitor (Task Manager)
// Live animated CPU/Memory telemetry and interactive process table

class TaskManagerApp {
    constructor(container, windowData) {
        this.container = container;
        this.win = windowData;
        this.cpuHistory = new Array(30).fill(12);
        this.memHistory = new Array(30).fill(34);
        this.timer = null;

        this.initUI();
        this.startMonitoring();
    }

    initUI() {
        this.container.innerHTML = `
            <div class="tm-wrapper">
                <div class="tm-telemetry-cards">
                    <div class="tm-card">
                        <div class="tm-card-header">
                            <span>CPU Usage</span>
                            <span class="tm-stat-val" id="tm-cpu-val">15%</span>
                        </div>
                        <canvas class="tm-canvas" id="tm-cpu-canvas" width="240" height="70"></canvas>
                    </div>
                    <div class="tm-card">
                        <div class="tm-card-header">
                            <span>Memory (RAM)</span>
                            <span class="tm-stat-val" id="tm-mem-val">5.8 / 16.0 GB</span>
                        </div>
                        <canvas class="tm-canvas" id="tm-mem-canvas" width="240" height="70"></canvas>
                    </div>
                </div>

                <div class="tm-process-section">
                    <div class="tm-section-title">Active Processes</div>
                    <div class="tm-table-container">
                        <table class="tm-table">
                            <thead>
                                <tr>
                                    <th>PID</th>
                                    <th>Process Name</th>
                                    <th>Status</th>
                                    <th>Memory</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="tm-process-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        this.cpuVal = this.container.querySelector('#tm-cpu-val');
        this.memVal = this.container.querySelector('#tm-mem-val');
        this.cpuCanvas = this.container.querySelector('#tm-cpu-canvas');
        this.memCanvas = this.container.querySelector('#tm-mem-canvas');
        this.tbody = this.container.querySelector('#tm-process-tbody');

        const originalClose = this.win.onClose;
        this.win.onClose = () => {
            if (this.timer) clearInterval(this.timer);
            if (typeof originalClose === 'function') originalClose();
        };
    }

    startMonitoring() {
        this.updateData();
        this.timer = setInterval(() => this.updateData(), 1000);
    }

    updateData() {
        const runningWindows = window.windowManager ? Array.from(window.windowManager.windows.values()) : [];
        const baseCpu = 8 + (runningWindows.length * 4);
        const currentCpu = Math.min(99, Math.max(5, Math.floor(baseCpu + (Math.random() * 14 - 7))));
        
        const baseMem = 4.2 + (runningWindows.length * 0.38);
        const currentMem = Number((baseMem + Math.random() * 0.2).toFixed(1));

        this.cpuHistory.push(currentCpu);
        this.cpuHistory.shift();

        this.memHistory.push(Math.round((currentMem / 16.0) * 100));
        this.memHistory.shift();

        this.cpuVal.textContent = `${currentCpu}%`;
        this.memVal.textContent = `${currentMem} / 16.0 GB`;

        this.drawChart(this.cpuCanvas, this.cpuHistory, '#00e5ff');
        this.drawChart(this.memCanvas, this.memHistory, '#a855f7');

        this.renderProcesses(runningWindows);
    }

    drawChart(canvas, data, strokeColor) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Draw background grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = 15; y < h; y += 18) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();

        // Draw line chart
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const step = w / (data.length - 1);
        data.forEach((val, i) => {
            const x = i * step;
            const y = h - (val / 100 * (h - 10)) - 5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Area gradient fill
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, strokeColor.replace('rgb', 'rgba').replace(')', ', 0.3)'));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
    }

    renderProcesses(windows) {
        this.tbody.innerHTML = '';

        // Kernel process
        const kernelRow = document.createElement('tr');
        kernelRow.innerHTML = `
            <td>1</td>
            <td>system_kernel</td>
            <td><span class="tm-badge sys">System</span></td>
            <td>128 MB</td>
            <td><span class="tm-protected">Protected</span></td>
        `;
        this.tbody.appendChild(kernelRow);

        // Window processes
        windows.forEach((win, idx) => {
            const pid = 100 + idx;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pid}</td>
                <td>${win.title}</td>
                <td><span class="tm-badge">${win.isMinimized ? 'Background' : 'Running'}</span></td>
                <td>${Math.floor(45 + (pid % 15) * 6)} MB</td>
                <td>
                    <button class="tm-kill-btn" data-win-id="${win.id}">End Task</button>
                </td>
            `;

            row.querySelector('.tm-kill-btn').addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playClick();
                window.windowManager.close(win.id);
                this.updateData();
            });

            this.tbody.appendChild(row);
        });
    }
}

window.TaskManagerApp = TaskManagerApp;
