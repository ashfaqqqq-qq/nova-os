// NovaOS Calculator Application
// Glassmorphic calculator with expression history, precision math, and keyboard listeners

class CalculatorApp {
    constructor(container, windowData) {
        this.container = container;
        this.win = windowData;
        this.currentInput = '0';
        this.expression = '';
        this.resetNext = false;

        this.initUI();
    }

    initUI() {
        this.container.innerHTML = `
            <div class="calc-wrapper">
                <div class="calc-screen">
                    <div class="calc-expr" id="calc-expr"></div>
                    <div class="calc-result" id="calc-res">0</div>
                </div>
                <div class="calc-keypad">
                    <button class="calc-btn fn" data-action="clear">C</button>
                    <button class="calc-btn fn" data-action="back">⌫</button>
                    <button class="calc-btn fn" data-action="percent">%</button>
                    <button class="calc-btn op" data-action="op" data-val="/">÷</button>

                    <button class="calc-btn num" data-val="7">7</button>
                    <button class="calc-btn num" data-val="8">8</button>
                    <button class="calc-btn num" data-val="9">9</button>
                    <button class="calc-btn op" data-action="op" data-val="*">×</button>

                    <button class="calc-btn num" data-val="4">4</button>
                    <button class="calc-btn num" data-val="5">5</button>
                    <button class="calc-btn num" data-val="6">6</button>
                    <button class="calc-btn op" data-action="op" data-val="-">−</button>

                    <button class="calc-btn num" data-val="1">1</button>
                    <button class="calc-btn num" data-val="2">2</button>
                    <button class="calc-btn num" data-val="3">3</button>
                    <button class="calc-btn op" data-action="op" data-val="+">+</button>

                    <button class="calc-btn fn" data-action="neg">±</button>
                    <button class="calc-btn num" data-val="0">0</button>
                    <button class="calc-btn num" data-val=".">.</button>
                    <button class="calc-btn equals" data-action="equals">=</button>
                </div>
            </div>
        `;

        this.exprEl = this.container.querySelector('#calc-expr');
        this.resEl = this.container.querySelector('#calc-res');

        this.container.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playClick();
                const val = btn.getAttribute('data-val');
                const action = btn.getAttribute('data-action');

                if (btn.classList.contains('num')) {
                    this.inputDigit(val);
                } else if (action === 'op') {
                    this.inputOp(val);
                } else if (action === 'equals') {
                    this.calculate();
                } else if (action === 'clear') {
                    this.clear();
                } else if (action === 'back') {
                    this.backspace();
                } else if (action === 'percent') {
                    this.percent();
                } else if (action === 'neg') {
                    this.negate();
                }
            });
        });

        // Keyboard handler
        this.keyListener = (e) => {
            if (!this.win.element.classList.contains('active')) return;
            if (e.key >= '0' && e.key <= '9' || e.key === '.') {
                this.inputDigit(e.key);
            } else if (['+', '-', '*', '/'].includes(e.key)) {
                this.inputOp(e.key);
            } else if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                this.calculate();
            } else if (e.key === 'Backspace') {
                this.backspace();
            } else if (e.key === 'Escape') {
                this.clear();
            }
        };

        window.addEventListener('keydown', this.keyListener);

        const originalClose = this.win.onClose;
        this.win.onClose = () => {
            window.removeEventListener('keydown', this.keyListener);
            if (typeof originalClose === 'function') originalClose();
        };
    }

    inputDigit(digit) {
        if (this.resetNext) {
            this.currentInput = '0';
            this.resetNext = false;
        }
        if (digit === '.') {
            if (!this.currentInput.includes('.')) {
                this.currentInput += '.';
            }
        } else {
            if (this.currentInput === '0') {
                this.currentInput = digit;
            } else {
                this.currentInput += digit;
            }
        }
        this.resEl.textContent = this.currentInput;
    }

    inputOp(op) {
        if (this.resetNext) {
            this.resetNext = false;
        }
        this.expression += ` ${this.currentInput} ${op}`;
        this.exprEl.textContent = this.expression;
        this.currentInput = '0';
        this.resEl.textContent = '0';
    }

    calculate() {
        if (!this.expression && this.currentInput === '0') return;
        const fullExpr = `${this.expression} ${this.currentInput}`.trim();
        try {
            // Validate expression safety
            if (!/^[0-9+\-*/().\s^%]+$/.test(fullExpr)) {
                throw new Error('Invalid syntax');
            }
            const result = Function(`'use strict'; return (${fullExpr})`)();
            this.exprEl.textContent = `${fullExpr} =`;
            this.currentInput = String(Number(result.toFixed(8))); // trim precision noise
            this.resEl.textContent = this.currentInput;
            this.expression = '';
            this.resetNext = true;
        } catch (e) {
            this.resEl.textContent = 'Error';
            this.expression = '';
            this.resetNext = true;
        }
    }

    clear() {
        this.currentInput = '0';
        this.expression = '';
        this.resetNext = false;
        this.exprEl.textContent = '';
        this.resEl.textContent = '0';
    }

    backspace() {
        if (this.resetNext) {
            this.clear();
            return;
        }
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.resEl.textContent = this.currentInput;
    }

    percent() {
        const val = parseFloat(this.currentInput) / 100;
        this.currentInput = String(val);
        this.resEl.textContent = this.currentInput;
    }

    negate() {
        if (this.currentInput !== '0') {
            if (this.currentInput.startsWith('-')) {
                this.currentInput = this.currentInput.slice(1);
            } else {
                this.currentInput = '-' + this.currentInput;
            }
            this.resEl.textContent = this.currentInput;
        }
    }
}

window.CalculatorApp = CalculatorApp;
