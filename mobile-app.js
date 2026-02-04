/* ===== ABLE MOBILE - MAIN SCRIPT ===== */

// Global State
let currentTool = 'pointer';
let isMathMode = false;
let scale = 1;
let translateX = 0;
let translateY = 0;
let isPanning = false;
let isDrawing = false;
let isDrawingArrow = false;
let isDraggingBox = false;
let startX, startY;
let lastTouchDistance = 0;
let activeMathBox = null;
let activeTextArea = null;
let conversionTimer = null;
let curveStep = 0;
let curveStartX, curveStartY, curveEndX, curveEndY;
let activeLine = null;

// DOM Elements
const viewport = document.getElementById('viewport');
const canvasContainer = document.getElementById('canvas-container');
const canvasArea = document.getElementById('canvas-area');
const arrowLayer = document.getElementById('arrow-layer');
const drawingLayer = document.getElementById('drawing-layer');
const previewLayer = document.getElementById('preview-layer');
const textInputModal = document.getElementById('text-input-modal');
const textInputArea = document.getElementById('text-input-area');
const textInputDone = document.getElementById('text-input-done');
const latexPreview = document.getElementById('latex-preview-content');
const helpModal = document.getElementById('help-modal');
const toast = document.getElementById('toast');
const modeStatus = document.getElementById('mode-status');
const fileInput = document.getElementById('file-input');

const dCtx = drawingLayer.getContext('2d');
const pCtx = previewLayer.getContext('2d');

// Comprehensive Shortcuts
const savedShortcuts = {
    'alpha': '\\alpha', 'beta': '\\beta', 'gamma': '\\gamma', 'delta': '\\delta', 'epsilon': '\\epsilon',
    'vepsilon': '\\varepsilon', 'zeta': '\\zeta', 'eta': '\\eta', 'theta': '\\theta', 'vtheta': '\\vartheta',
    'iota': '\\iota', 'kappa': '\\kappa', 'lambda': '\\lambda', 'mu': '\\mu', 'nu': '\\nu', 'xi': '\\xi',
    'pi': '\\pi', 'rho': '\\rho', 'vrho': '\\varrho', 'sigma': '\\sigma', 'tau': '\\tau', 'upsilon': '\\upsilon',
    'phi': '\\phi', 'vphi': '\\varphi', 'chi': '\\chi', 'psi': '\\psi', 'omega': '\\omega',
    'Gamma': '\\Gamma', 'Delta': '\\Delta', 'Theta': '\\Theta', 'Lambda': '\\Lambda', 'Xi': '\\Xi',
    'Pi': '\\Pi', 'Sigma': '\\Sigma', 'Upsilon': '\\Upsilon', 'Phi': '\\Phi', 'Psi': '\\Psi', 'Omega': '\\Omega',
    'ify': '\\infty', 'pm': '\\pm', 'grad': '\\nabla', 'del': '\\partial', 'xx': '\\times', 'ast': '\\cdot', 'times': '\\times',
    'tf': '\\therefore', 'bc': '\\because', 'and': '\\land', 'or': '\\lor', 'not': '\\neg', 'eqv': '\\equiv',
    'sim': '\\sim', 'approx': '\\approx', 'prop': '\\propto', 'LL': '\\ll', 'GG': '\\gg', 'AA': '\\forall', 'EE': '\\exists',
    'bra': '\\bra{#@}', 'ket': '\\ket{#@}', 'braket': '\\braket{#@ | #@}', 'hatH': '\\hat{H}', 'dag': '\\dagger', 'hbar': '\\hbar', 'ell': '\\ell',
    'ale': '\\aleph', 'bet': '\\beth', 'dal': '\\daleth', 'mscr': '\\mathscr{#@}', 'in': '\\in', 'notin': '\\notin', 'uu': '\\cup', 'nn': '\\cap',
    'sub': '\\subset', 'sup': '\\supset', 'sube': '\\subseteq', 'supe': '\\supseteq', 'eset': '\\emptyset',
    'RR': '\\mathbb{R}', 'ZZ': '\\mathbb{Z}', 'NN': '\\mathbb{N}', 'CC': '\\mathbb{C}', 'QQ': '\\mathbb{Q}',
    'int': '\\int', 'dint': '\\int_{#@}^{#@}', 'iint': '\\iint', 'iiint': '\\iiint', 'oint': '\\oint', 'oiint': '\\oiint', 'oiiint': '\\oiiint',
    'prod': '\\prod_{#@}^{#@}', 'sum': '\\sum_{#@}^{#@}', 'bcap': '\\bigcap', 'bcup': '\\bigcup', 'bop': '\\bigoplus', 'bot': '\\bigotimes',
    'asin': '\\arcsin', 'acos': '\\arccos', 'atan': '\\arctan', 'sinh': '\\sinh', 'cosh': '\\cosh', 'log': '\\log_{#@}{#@}', 'ln': '\\ln{#@}',
    'can': '\\cancel{#@}', 'box': '\\boxed{#@}', 'obra': '\\overbrace{#@}^{#@}', 'ubra': '\\underbrace{#@}_{#@}', 'ang': '\\angle', 'perp': '\\perp',
    'para': '\\parallel', 'tri': '\\triangle', 'sq': '\\square', 'deg': '^\\circ', '||': '\\| #@ \\|', 'bar': '\\bar{#@}', 'vec': '\\vec{#@}',
    'hat': '\\hat{#@}', 'dot': '\\dot{#@}', 'ddot': '\\ddot{#@}', 'dddot': '\\dddot{#@}', 'tilde': '\\tilde{#@}', '^T': '^{T}',
    'impl': '\\implies', 'iff': '\\iff', 'ib': '\\impliedby', 'up': '\\uparrow', 'dn': '\\downarrow', 'lr': '\\leftrightarrow', 'map': '\\mapsto',
    'har': '\\rightleftharpoons', 'mcal': '\\mathcal{#@}', 'mfr': '\\mathfrak{#@}', 'mtt': '\\mathtt{#@}', 'mbf': '\\mathbf{#@}', 'mit': '\\mathit{#@}',
    'lim': '\\lim_{#@ \\to #@}', 'fr': '\\frac{#@}{#@}', 'df': '\\frac{\\partial #@}{\\partial #@}', 'pd': '\\frac{d #@}{d #@}',
    'lm': '\\lim_{#@ \\to #@}', 'sm': '\\sum_{#@}^{#@}', 'rt': '\\sqrt{#@}', 'bf': '\\mathbf{#@}', 'cb': '\\mathcal{#@}', 'bb': '\\mathbb{#@}'
};

// History
const historyStack = [];
const MAX_HISTORY_SIZE = 50;
const AUTOSAVE_DELAY = 2000;
let saveTimeout = null;


// Initialize
function init() {
    resizeCanvas();
    setupEventListeners();
    loadFromLocalStorage();
    if (document.querySelectorAll('.math-box').length === 0) {
        createMathBox(400, 400);
    }
}

function resizeCanvas() {
    const w = 5000, h = 5000;
    drawingLayer.width = w;
    drawingLayer.height = h;
    previewLayer.width = w;
    previewLayer.height = h;
    dCtx.strokeStyle = '#4da6ff';
    dCtx.lineWidth = 2;
    dCtx.lineCap = 'round';
    dCtx.lineJoin = 'round';
    pCtx.strokeStyle = '#4da6ff';
    pCtx.lineWidth = 2;
    pCtx.lineCap = 'round';
    pCtx.lineJoin = 'round';
}

function setupEventListeners() {
    document.getElementById('drawing-toolbar').querySelector('.toolbar-header').addEventListener('click', () => {
        document.getElementById('drawing-toolbar').classList.toggle('collapsed');
        document.getElementById('drawing-toolbar').classList.toggle('expanded');
    });
    document.getElementById('canvas-toolbar').querySelector('.toolbar-header').addEventListener('click', () => {
        document.getElementById('canvas-toolbar').classList.toggle('collapsed');
        document.getElementById('canvas-toolbar').classList.toggle('expanded');
    });
    modeStatus.addEventListener('click', toggleMode);
    ['pointer', 'pen', 'line', 'circle', 'curve', 'eraser', 'arrow'].forEach(tool => {
        const btn = document.getElementById('tool-' + tool);
        if (btn) btn.addEventListener('click', () => selectTool(tool));
    });
    document.getElementById('tool-grid').addEventListener('click', toggleGrid);
    document.getElementById('tool-clear').addEventListener('click', clearEditor);
    document.getElementById('tool-undo').addEventListener('click', performUndo);
    document.getElementById('btn-help').addEventListener('click', () => helpModal.classList.add('active'));
    document.getElementById('help-close').addEventListener('click', () => helpModal.classList.remove('active'));
    document.getElementById('btn-export-able').addEventListener('click', exportABLE);
    document.getElementById('btn-import-able').addEventListener('click', () => fileInput.click());
    document.getElementById('btn-export-pdf').addEventListener('click', exportToPDF);
    fileInput.addEventListener('change', importABLE);
    textInputDone.addEventListener('click', finishTextInput);
    textInputArea.addEventListener('input', handleTextInput);
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd, { passive: false });
    viewport.addEventListener('contextmenu', (e) => e.preventDefault());
}

function selectTool(tool) {
    currentTool = tool;
    curveStep = 0;
    document.querySelectorAll('#drawing-toolbar .tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tool-' + tool).classList.add('active');
}

function toggleGrid() {
    const grid = document.getElementById('grid-layer');
    const isHidden = grid.style.display === 'none';
    grid.style.display = isHidden ? 'block' : 'none';
    document.getElementById('tool-grid').classList.toggle('active', isHidden);
}

function toggleMode() {
    isMathMode = !isMathMode;
    modeStatus.textContent = isMathMode ? 'MODE: MATH' : 'MODE: TEXT';
    modeStatus.classList.toggle('active', isMathMode);
    showToast(isMathMode ? 'Math Mode ON' : 'Text Mode ON');
}


// Math Box Creation
function createMathBox(x, y, initialValue = '') {
    const container = document.createElement('div');
    container.className = 'math-box';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    const handle = document.createElement('div');
    handle.className = 'box-handle';
    container.appendChild(handle);
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-box-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        container.remove();
        triggerAutoSave();
    });
    container.appendChild(closeBtn);
    const display = document.createElement('div');
    display.className = 'math-display';
    display.dataset.latex = initialValue;
    container.appendChild(display);
    if (initialValue) {
        renderMathDisplay(display, initialValue);
    }
    display.addEventListener('click', () => {
        openTextInput(container, display);
    });
    setupDrag(handle, container);
    canvasArea.appendChild(container);
    triggerAutoSave();
    return container;
}

function renderMathDisplay(display, latex) {
    const mf = document.createElement('math-field');
    mf.value = latex;
    mf.readOnly = true;
    mf.style.fontSize = '22px';
    mf.style.background = 'transparent';
    mf.style.border = 'none';
    mf.style.color = 'white';
    display.innerHTML = '';
    display.appendChild(mf);
    display.dataset.latex = latex;
}

// Text Input with Conversion
function openTextInput(mathBox, display) {
    activeMathBox = mathBox;
    activeTextArea = display;
    textInputArea.value = display.dataset.latex || '';
    textInputModal.classList.add('active');
    updateLatexPreview();
    setTimeout(() => textInputArea.focus(), 100);
}

function handleTextInput() {
    if (conversionTimer) clearTimeout(conversionTimer);
    conversionTimer = setTimeout(() => {
        convertShortcuts();
        updateLatexPreview();
    }, 500);
}

function convertShortcuts() {
    if (!isMathMode) return;
    let text = textInputArea.value;
    const cursorPos = textInputArea.selectionStart;
    const sortedShortcuts = Object.keys(savedShortcuts).sort((a, b) => b.length - a.length);
    let replacements = [];
    for (const shortcut of sortedShortcuts) {
        const regex = new RegExp('\\b' + escapeRegExp(shortcut) + '\\b', 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            replacements.push({
                start: match.index,
                end: match.index + shortcut.length,
                shortcut: shortcut,
                replacement: savedShortcuts[shortcut]
            });
        }
    }
    replacements.sort((a, b) => b.start - a.start);
    let newText = text;
    let cursorAdjustment = 0;
    for (const rep of replacements) {
        const before = newText.substring(0, rep.start);
        const after = newText.substring(rep.end);
        newText = before + rep.replacement + after;
        if (rep.end <= cursorPos) {
            cursorAdjustment += rep.replacement.length - rep.shortcut.length;
        }
    }
    if (newText !== text) {
        textInputArea.value = newText;
        textInputArea.setSelectionRange(cursorPos + cursorAdjustment, cursorPos + cursorAdjustment);
    }
    handleMatrixPatterns();
}

function handleMatrixPatterns() {
    let text = textInputArea.value;
    const cursorPos = textInputArea.selectionStart;
    const matMatch = text.match(/([1-9])([1-9])mat/g);
    if (matMatch) {
        for (const match of matMatch) {
            const rows = parseInt(match[0]);
            const cols = parseInt(match[1]);
            const matrix = generateStructure(rows, cols, 'pmatrix');
            text = text.replace(match, matrix);
        }
    }
    const detMatch = text.match(/([1-9])([1-9])det/g);
    if (detMatch) {
        for (const match of detMatch) {
            const rows = parseInt(match[0]);
            const cols = parseInt(match[1]);
            const matrix = generateStructure(rows, cols, 'vmatrix');
            text = text.replace(match, matrix);
        }
    }
    if (text !== textInputArea.value) {
        textInputArea.value = text;
        textInputArea.setSelectionRange(cursorPos, cursorPos);
    }
}

function generateStructure(r, c, type) {
    let s = `\\begin{${type}}`;
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            s += (i === 0 && j === 0) ? '#@' : '#?';
            if (j < c - 1) s += ' & ';
        }
        if (i < r - 1) s += ' \\\\ ';
    }
    return s + `\\end{${type}}`;
}

function updateLatexPreview() {
    const latex = textInputArea.value;
    if (latex) {
        const mf = document.createElement('math-field');
        mf.value = latex;
        mf.readOnly = true;
        latexPreview.innerHTML = '';
        latexPreview.appendChild(mf);
    } else {
        latexPreview.innerHTML = '<span style="color: #666;">Preview will appear here...</span>';
    }
}

function finishTextInput() {
    const latex = textInputArea.value;
    if (activeTextArea && activeMathBox) {
        renderMathDisplay(activeTextArea, latex);
        activeMathBox.classList.remove('focused');
    }
    textInputModal.classList.remove('active');
    activeMathBox = null;
    activeTextArea = null;
    triggerAutoSave();
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// Touch Handling
let touches = {};
let lastTap = 0;

function handleTouchStart(e) {
    e.preventDefault();
    if (e.target.closest('.toolbar') || e.target.closest('#bottom-controls') || e.target.closest('#mode-status') || e.target.closest('.math-box')) {
        return;
    }
    const touch = e.touches[0];
    const now = Date.now();
    if (now - lastTap < 300) {
        handleDoubleTap(touch);
        lastTap = 0;
        return;
    }
    lastTap = now;
    if (e.touches.length === 1) {
        handleSingleTouchStart(touch);
    } else if (e.touches.length === 2) {
        handlePinchStart(e.touches);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && !isDraggingBox) {
        handleSingleTouchMove(e.touches[0]);
    } else if (e.touches.length === 2) {
        handlePinchMove(e.touches);
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (isDrawing || isDrawingArrow) {
        finishDrawing();
    }
    isPanning = false;
    isDrawing = false;
    isDrawingArrow = false;
    isDraggingBox = false;
    lastTouchDistance = 0;
    touches = {};
    pCtx.clearRect(0, 0, previewLayer.width, previewLayer.height);
}

function handleDoubleTap(touch) {
    const rect = canvasContainer.getBoundingClientRect();
    const x = (touch.clientX - rect.left - translateX) / scale;
    const y = (touch.clientY - rect.top - translateY) / scale;
    createMathBox(x, y);
    showToast('Math box created');
}

function handleSingleTouchStart(touch) {
    const rect = canvasContainer.getBoundingClientRect();
    startX = (touch.clientX - rect.left - translateX) / scale;
    startY = (touch.clientY - rect.top - translateY) / scale;
    if (currentTool === 'pointer') {
        isPanning = true;
    } else if (currentTool === 'arrow') {
        startDrawingArrow(startX, startY);
    } else {
        startDrawing(startX, startY);
    }
}

function handleSingleTouchMove(touch) {
    const rect = canvasContainer.getBoundingClientRect();
    const x = (touch.clientX - rect.left - translateX) / scale;
    const y = (touch.clientY - rect.top - translateY) / scale;
    if (isPanning && currentTool === 'pointer') {
        const dx = touch.clientX - (startX * scale + translateX + rect.left);
        const dy = touch.clientY - (startY * scale + translateY + rect.top);
        translateX += dx;
        translateY += dy;
        updateTransform();
        startX = (touch.clientX - rect.left - translateX) / scale;
        startY = (touch.clientY - rect.top - translateY) / scale;
    } else if (isDrawing) {
        continueDrawing(x, y);
    } else if (isDrawingArrow) {
        updateArrow(x, y);
    }
}

function handlePinchStart(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
}

function handlePinchMove(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (lastTouchDistance > 0) {
        const pinchCenter = {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
        const delta = distance / lastTouchDistance;
        const newScale = Math.min(Math.max(scale * delta, 0.5), 3);
        const rect = canvasContainer.getBoundingClientRect();
        const beforeX = (pinchCenter.x - rect.left - translateX) / scale;
        const beforeY = (pinchCenter.y - rect.top - translateY) / scale;
        scale = newScale;
        const afterX = (pinchCenter.x - rect.left - translateX) / scale;
        const afterY = (pinchCenter.y - rect.top - translateY) / scale;
        translateX += (afterX - beforeX) * scale;
        translateY += (afterY - beforeY) * scale;
        updateTransform();
    }
    lastTouchDistance = distance;
}

function updateTransform() {
    canvasContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}


// Drawing
function startDrawing(x, y) {
    isDrawing = true;
    startX = x;
    startY = y;
    if (currentTool === 'pen') {
        dCtx.beginPath();
        dCtx.moveTo(x, y);
    } else if (currentTool === 'eraser') {
        dCtx.globalCompositeOperation = 'destination-out';
        dCtx.lineWidth = 20;
        dCtx.beginPath();
        dCtx.moveTo(x, y);
    }
}

function continueDrawing(x, y) {
    if (!isDrawing) return;
    if (currentTool === 'pen' || currentTool === 'eraser') {
        dCtx.lineTo(x, y);
        dCtx.stroke();
    } else if (currentTool === 'line') {
        pCtx.clearRect(0, 0, previewLayer.width, previewLayer.height);
        pCtx.beginPath();
        pCtx.moveTo(startX, startY);
        pCtx.lineTo(x, y);
        pCtx.stroke();
    } else if (currentTool === 'circle') {
        pCtx.clearRect(0, 0, previewLayer.width, previewLayer.height);
        const rx = Math.abs(x - startX) / 2;
        const ry = Math.abs(y - startY) / 2;
        pCtx.beginPath();
        pCtx.ellipse(startX + (x - startX) / 2, startY + (y - startY) / 2, rx, ry, 0, 0, 2 * Math.PI);
        pCtx.stroke();
    } else if (currentTool === 'curve') {
        pCtx.clearRect(0, 0, previewLayer.width, previewLayer.height);
        if (curveStep === 0) {
            pCtx.beginPath();
            pCtx.moveTo(startX, startY);
            pCtx.lineTo(x, y);
            pCtx.stroke();
        } else {
            pCtx.beginPath();
            pCtx.moveTo(curveStartX, curveStartY);
            pCtx.quadraticCurveTo(x, y, curveEndX, curveEndY);
            pCtx.stroke();
        }
    }
}

function finishDrawing() {
    if (!isDrawing && !isDrawingArrow) return;
    if (isDrawing) {
        if (currentTool === 'line') {
            const rect = canvasContainer.getBoundingClientRect();
            const lastTouch = event.changedTouches[0];
            const x = (lastTouch.clientX - rect.left - translateX) / scale;
            const y = (lastTouch.clientY - rect.top - translateY) / scale;
            dCtx.beginPath();
            dCtx.moveTo(startX, startY);
            dCtx.lineTo(x, y);
            dCtx.stroke();
        } else if (currentTool === 'circle') {
            const rect = canvasContainer.getBoundingClientRect();
            const lastTouch = event.changedTouches[0];
            const x = (lastTouch.clientX - rect.left - translateX) / scale;
            const y = (lastTouch.clientY - rect.top - translateY) / scale;
            const rx = Math.abs(x - startX) / 2;
            const ry = Math.abs(y - startY) / 2;
            dCtx.beginPath();
            dCtx.ellipse(startX + (x - startX) / 2, startY + (y - startY) / 2, rx, ry, 0, 0, 2 * Math.PI);
            dCtx.stroke();
        } else if (currentTool === 'curve') {
            if (curveStep === 0) {
                const rect = canvasContainer.getBoundingClientRect();
                const lastTouch = event.changedTouches[0];
                const x = (lastTouch.clientX - rect.left - translateX) / scale;
                const y = (lastTouch.clientY - rect.top - translateY) / scale;
                curveStartX = startX;
                curveStartY = startY;
                curveEndX = x;
                curveEndY = y;
                curveStep = 1;
                return;
            } else {
                const rect = canvasContainer.getBoundingClientRect();
                const lastTouch = event.changedTouches[0];
                const x = (lastTouch.clientX - rect.left - translateX) / scale;
                const y = (lastTouch.clientY - rect.top - translateY) / scale;
                dCtx.beginPath();
                dCtx.moveTo(curveStartX, curveStartY);
                dCtx.quadraticCurveTo(x, y, curveEndX, curveEndY);
                dCtx.stroke();
                curveStep = 0;
            }
        }
        if (currentTool === 'eraser') {
            dCtx.globalCompositeOperation = 'source-over';
            dCtx.lineWidth = 2;
        }
        saveHistory('scribble', null);
    }
    pCtx.clearRect(0, 0, previewLayer.width, previewLayer.height);
    isDrawing = false;
    isDrawingArrow = false;
}

// Arrow Drawing
function startDrawingArrow(x, y) {
    isDrawingArrow = true;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', y);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#4da6ff');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    arrowLayer.appendChild(line);
    activeLine = line;
}

function updateArrow(x, y) {
    if (activeLine) {
        activeLine.setAttribute('x2', x);
        activeLine.setAttribute('y2', y);
    }
}

// Box Dragging
function setupDrag(handle, container) {
    let dragStartX, dragStartY, boxStartX, boxStartY;
    handle.addEventListener('touchstart', (e) => {
        if (currentTool !== 'pointer') return;
        e.stopPropagation();
        isDraggingBox = true;
        const touch = e.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        boxStartX = container.offsetLeft;
        boxStartY = container.offsetTop;
        container.classList.add('focused');
    });
    handle.addEventListener('touchmove', (e) => {
        if (!isDraggingBox) return;
        e.stopPropagation();
        const touch = e.touches[0];
        const dx = (touch.clientX - dragStartX) / scale;
        const dy = (touch.clientY - dragStartY) / scale;
        container.style.left = (boxStartX + dx) + 'px';
        container.style.top = (boxStartY + dy) + 'px';
    });
    handle.addEventListener('touchend', (e) => {
        if (isDraggingBox) {
            isDraggingBox = false;
            container.classList.remove('focused');
            triggerAutoSave();
        }
    });
}


// History
function saveHistory(type, obj) {
    historyStack.push({
        type: type,
        obj: obj,
        state: drawingLayer.toDataURL()
    });
    if (historyStack.length > MAX_HISTORY_SIZE) {
        historyStack.shift();
    }
    triggerAutoSave();
}

function performUndo() {
    if (historyStack.length === 0) {
        showToast('Nothing to undo');
        return;
    }
    const last = historyStack.pop();
    if (last.type === 'arrow' && last.obj) {
        last.obj.remove();
    } else if (last.type === 'scribble') {
        if (historyStack.length > 0) {
            const prev = historyStack[historyStack.length - 1];
            const img = new Image();
            img.onload = () => {
                dCtx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
                dCtx.drawImage(img, 0, 0);
            };
            img.src = prev.state;
        } else {
            dCtx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
        }
    }
    showToast('Undo');
    triggerAutoSave();
}

function clearEditor() {
    if (!confirm('Clear everything?')) return;
    document.querySelectorAll('.math-box').forEach(b => b.remove());
    arrowLayer.querySelectorAll('line').forEach(l => l.remove());
    dCtx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
    historyStack.length = 0;
    showToast('Cleared');
    triggerAutoSave();
}

// Auto-Save
function triggerAutoSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToLocalStorage, AUTOSAVE_DELAY);
}

function saveToLocalStorage() {
    try {
        const data = {
            format: 'ABLE_AUTOSAVE_MOBILE',
            version: 1,
            timestamp: Date.now(),
            boxes: Array.from(document.querySelectorAll('.math-box')).map(b => ({
                x: b.offsetLeft,
                y: b.offsetTop,
                c: b.querySelector('.math-display').dataset.latex || ''
            })),
            arrows: Array.from(arrowLayer.querySelectorAll('line')).map(l => ({
                x1: l.getAttribute('x1'),
                y1: l.getAttribute('y1'),
                x2: l.getAttribute('x2'),
                y2: l.getAttribute('y2')
            })),
            draw: drawingLayer.toDataURL(),
            viewport: { scale, translateX, translateY }
        };
        localStorage.setItem('able_autosave_mobile', JSON.stringify(data));
        console.log('Auto-saved');
    } catch (e) {
        console.warn('Auto-save failed:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('able_autosave_mobile');
        if (!saved) return false;
        const d = JSON.parse(saved);
        document.querySelectorAll('.math-box').forEach(b => b.remove());
        arrowLayer.querySelectorAll('line').forEach(l => l.remove());
        if (d.boxes) {
            d.boxes.forEach(bx => createMathBox(bx.x, bx.y, bx.c));
        }
        if (d.arrows) {
            d.arrows.forEach(ar => {
                const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                l.setAttribute('x1', ar.x1);
                l.setAttribute('y1', ar.y1);
                l.setAttribute('x2', ar.x2);
                l.setAttribute('y2', ar.y2);
                l.setAttribute('stroke', '#4da6ff');
                l.setAttribute('stroke-width', '2');
                l.setAttribute('marker-end', 'url(#arrowhead)');
                arrowLayer.appendChild(l);
            });
        }
        if (d.draw) {
            const img = new Image();
            img.onload = () => {
                dCtx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
                dCtx.drawImage(img, 0, 0);
            };
            img.src = d.draw;
        }
        if (d.viewport) {
            scale = d.viewport.scale || 1;
            translateX = d.viewport.translateX || 0;
            translateY = d.viewport.translateY || 0;
            updateTransform();
        }
        showToast('Session restored');
        return true;
    } catch (e) {
        console.warn('Failed to load auto-save:', e);
        return false;
    }
}

// Export/Import
function exportABLE() {
    const data = {
        format: 'ABLE',
        boxes: Array.from(document.querySelectorAll('.math-box')).map(b => ({
            x: b.offsetLeft,
            y: b.offsetTop,
            c: b.querySelector('.math-display').dataset.latex || ''
        })),
        arrows: Array.from(arrowLayer.querySelectorAll('line')).map(l => ({
            x1: l.getAttribute('x1'),
            y1: l.getAttribute('y1'),
            x2: l.getAttribute('x2'),
            y2: l.getAttribute('y2')
        })),
        draw: drawingLayer.toDataURL()
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Note_${Date.now()}.able`;
    a.click();
    showToast('Saved!');
}

function importABLE(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const d = JSON.parse(ev.target.result);
            document.querySelectorAll('.math-box').forEach(b => b.remove());
            arrowLayer.querySelectorAll('line').forEach(l => l.remove());
            d.boxes.forEach(bx => createMathBox(bx.x, bx.y, bx.c));
            d.arrows.forEach(ar => {
                const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                l.setAttribute('x1', ar.x1);
                l.setAttribute('y1', ar.y1);
                l.setAttribute('x2', ar.x2);
                l.setAttribute('y2', ar.y2);
                l.setAttribute('stroke', '#4da6ff');
                l.setAttribute('stroke-width', '2');
                l.setAttribute('marker-end', 'url(#arrowhead)');
                arrowLayer.appendChild(l);
            });
            if (d.draw) {
                const img = new Image();
                img.onload = () => {
                    dCtx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
                    dCtx.drawImage(img, 0, 0);
                };
                img.src = d.draw;
            }
            showToast('Loaded!');
        } catch (err) {
            showToast('Error loading file');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

async function exportToPDF() {
    showToast('Generating PDF...');
    try {
        document.querySelectorAll('.toolbar, #bottom-controls, #mode-status, #brand-header').forEach(el => {
            el.style.visibility = 'hidden';
        });
        const canvas = await html2canvas(canvasArea, {
            backgroundColor: '#1e1e1e',
            scale: 2
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`ABLE_${Date.now()}.pdf`);
        showToast('PDF exported!');
    } catch (err) {
        showToast('PDF export failed');
        console.error(err);
    } finally {
        document.querySelectorAll('.toolbar, #bottom-controls, #mode-status, #brand-header').forEach(el => {
            el.style.visibility = 'visible';
        });
    }
}

// Utilities
function showToast(msg) {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

// Start
window.addEventListener('load', init);
