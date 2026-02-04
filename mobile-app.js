/* ===== ABLE MOBILE - OPTIMIZED CORE ===== */

// Global State
let currentTool = 'pointer';
let isMathMode = false;

// Viewport State
let scale = 1;
let translateX = 0;
let translateY = 0;
let isPanning = false;
let isDraggingBox = false;
let startX, startY;
let lastTouchDistance = 0;

// Drawing State (Vector System)
let isDrawing = false;
let isDrawingArrow = false;
let currentStroke = []; // Stores points for the line currently being drawn
let allStrokes = [];    // Stores history of all strokes (vector data)
let arrowHistory = [];  // Separate tracking for SVG arrows

// Tools State
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

// Contexts
const dCtx = drawingLayer.getContext('2d', { alpha: true }); // Optimized context
const pCtx = previewLayer.getContext('2d', { alpha: true });

// Input Handling
let activeMathBox = null;
let activeTextArea = null;
let conversionTimer = null;

// Shortcuts Dictionary (Same as before)
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

// Initialize
function init() {
    initCanvas();
    setupEventListeners();
    // loadFromLocalStorage(); // DISABLED FOR STABILITY
    
    // Create start box if empty
    if (document.querySelectorAll('.math-box').length === 0) {
        createMathBox(200, 300);
    }
}

function initCanvas() {
    // 2500x2500 is ~25MB RAM. 5000x5000 is ~100MB RAM.
    // We reduce size for mobile stability.
    const w = 2500, h = 2500; 
    
    drawingLayer.width = w;
    drawingLayer.height = h;
    previewLayer.width = w;
    previewLayer.height = h;
    
    // Set styles
    setContextStyles(dCtx);
    setContextStyles(pCtx);
}

function setContextStyles(ctx) {
    ctx.strokeStyle = '#4da6ff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function setupEventListeners() {
    // Toolbars
    document.getElementById('drawing-toolbar').querySelector('.toolbar-header').addEventListener('click', toggleToolbar);
    document.getElementById('canvas-toolbar').querySelector('.toolbar-header').addEventListener('click', toggleToolbar);
    
    // Tools
    modeStatus.addEventListener('click', toggleMode);
    ['pointer', 'pen', 'line', 'circle', 'curve', 'eraser', 'arrow'].forEach(tool => {
        const btn = document.getElementById('tool-' + tool);
        if (btn) btn.addEventListener('click', () => selectTool(tool));
    });
    
    document.getElementById('tool-grid').addEventListener('click', toggleGrid);
    document.getElementById('tool-clear').addEventListener('click', clearEditor);
    document.getElementById('tool-undo').addEventListener('click', performUndo);
    
    // Modals & UI
    document.getElementById('btn-help').addEventListener('click', () => helpModal.classList.add('active'));
    document.getElementById('help-close').addEventListener('click', () => helpModal.classList.remove('active'));
    document.getElementById('btn-export-able').addEventListener('click', exportABLE);
    document.getElementById('btn-import-able').addEventListener('click', () => fileInput.click());
    document.getElementById('btn-export-pdf').addEventListener('click', exportToPDF);
    fileInput.addEventListener('change', importABLE);
    
    // Text Input
    textInputDone.addEventListener('click', finishTextInput);
    textInputArea.addEventListener('input', handleTextInput);
    
    // Touch Events (Passive: false is needed for preventing scroll)
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function toggleToolbar(e) {
    const toolbar = e.currentTarget.parentElement;
    toolbar.classList.toggle('collapsed');
    toolbar.classList.toggle('expanded');
}

function selectTool(tool) {
    currentTool = tool;
    curveStep = 0;
    document.querySelectorAll('#drawing-toolbar .tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tool-' + tool);
    if(btn) btn.classList.add('active');
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

/* ===== VECTOR DRAWING SYSTEM (Replaces DataURL) ===== */

function startDrawing(x, y) {
    isDrawing = true;
    currentStroke = [{x, y}]; // Start new vector path
    
    dCtx.beginPath();
    dCtx.moveTo(x, y);
    
    // Eraser settings
    if (currentTool === 'eraser') {
        dCtx.globalCompositeOperation = 'destination-out';
        dCtx.lineWidth = 20;
    } else {
        dCtx.globalCompositeOperation = 'source-over';
        dCtx.lineWidth = 2;
    }
}

function continueDrawing(x, y) {
    if (!isDrawing) return;
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
        // Draw directly to canvas for performance
        dCtx.lineTo(x, y);
        dCtx.stroke();
        
        // Save point for vector history
        // Optimization: Only save if distance > 2px to reduce data points
        const last = currentStroke[currentStroke.length - 1];
        const dist = Math.abs(x - last.x) + Math.abs(y - last.y);
        if (dist > 2) {
            currentStroke.push({x, y});
        }
    } 
    else if (currentTool === 'line' || currentTool === 'circle' || currentTool === 'curve') {
        // Preview logic
        pCtx.clearRect(0, 0, previewLayer.width, previewLayer.height);
        
        if (currentTool === 'line') {
            pCtx.beginPath();
            pCtx.moveTo(currentStroke[0].x, currentStroke[0].y);
            pCtx.lineTo(x, y);
            pCtx.stroke();
        } else if (currentTool === 'circle') {
            const start = currentStroke[0];
            const rx = Math.abs(x - start.x) / 2;
            const ry = Math.abs(y - start.y) / 2;
            const cx = start.x + (x - start.x) / 2;
            const cy = start.y + (y - start.y) / 2;
            pCtx.beginPath();
            pCtx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
            pCtx.stroke();
        } else if (currentTool === 'curve') {
             if (curveStep === 0) {
                pCtx.beginPath();
                pCtx.moveTo(currentStroke[0].x, currentStroke[0].y);
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
}

function finishDrawing() {
    if (!isDrawing && !isDrawingArrow) return;
    
    if (isDrawing) {
        const lastTouch = event.changedTouches ? event.changedTouches[0] : null;
        let x = startX;
        let y = startY;
        
        if (lastTouch) {
            const rect = canvasContainer.getBoundingClientRect();
            x = (lastTouch.clientX - rect.left - translateX) / scale;
            y = (lastTouch.clientY - rect.top - translateY) / scale;
        }

        // Commit Shape Tools
        if (currentTool === 'line') {
            currentStroke.push({x, y});
            allStrokes.push({ type: 'line', points: [...currentStroke], color: '#4da6ff' });
            redrawCanvas(); // Rerender perfectly from vector
        } 
        else if (currentTool === 'circle') {
            currentStroke.push({x, y});
            allStrokes.push({ type: 'circle', points: [...currentStroke], color: '#4da6ff' });
            redrawCanvas();
        }
        else if (currentTool === 'curve') {
             if (curveStep === 0) {
                curveStartX = currentStroke[0].x;
                curveStartY = currentStroke[0].y;
                curveEndX = x;
                curveEndY = y;
                curveStep = 1;
                // Don't finish drawing yet
                return; 
            } else {
                allStrokes.push({ 
                    type: 'curve', 
                    start: {x: curveStartX, y: curveStartY},
                    control: {x, y},
                    end: {x: curveEndX, y: curveEndY},
                    color: '#4da6ff' 
                });
                curveStep = 0;
                redrawCanvas();
            }
        }
        else {
            // Commit Pen/Eraser
            // We push the stroke data. 'mode' determines if it adds or removes
            allStrokes.push({
                type: 'scribble',
                mode: currentTool === 'eraser' ? 'erase' : 'draw',
                points: currentStroke
            });
        }
        
        // Reset Context
        dCtx.globalCompositeOperation = 'source-over';
        dCtx.lineWidth = 2;
    }
    
    pCtx.clearRect(0, 0, previewLayer.width, previewLayer.height);
    isDrawing = false;
    isDrawingArrow = false;
}

// THE FIX: Redraw from vector data instead of restoring images
function redrawCanvas() {
    // 1. Clear Canvas
    dCtx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
    
    // 2. Replay all strokes
    allStrokes.forEach(stroke => {
        dCtx.beginPath();
        
        if (stroke.type === 'scribble') {
            dCtx.globalCompositeOperation = stroke.mode === 'erase' ? 'destination-out' : 'source-over';
            dCtx.lineWidth = stroke.mode === 'erase' ? 20 : 2;
            
            if (stroke.points.length > 0) {
                dCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
                for (let i = 1; i < stroke.points.length; i++) {
                    dCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
                }
            }
            dCtx.stroke();
        } 
        else if (stroke.type === 'line') {
            dCtx.globalCompositeOperation = 'source-over';
            dCtx.lineWidth = 2;
            dCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
            dCtx.lineTo(stroke.points[1].x, stroke.points[1].y);
            dCtx.stroke();
        }
        else if (stroke.type === 'circle') {
            dCtx.globalCompositeOperation = 'source-over';
            dCtx.lineWidth = 2;
            const start = stroke.points[0];
            const end = stroke.points[1];
            const rx = Math.abs(end.x - start.x) / 2;
            const ry = Math.abs(end.y - start.y) / 2;
            const cx = start.x + (end.x - start.x) / 2;
            const cy = start.y + (end.y - start.y) / 2;
            dCtx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
            dCtx.stroke();
        }
        else if (stroke.type === 'curve') {
            dCtx.globalCompositeOperation = 'source-over';
            dCtx.lineWidth = 2;
            dCtx.moveTo(stroke.start.x, stroke.start.y);
            dCtx.quadraticCurveTo(stroke.control.x, stroke.control.y, stroke.end.x, stroke.end.y);
            dCtx.stroke();
        }
    });
    
    // Reset to defaults
    dCtx.globalCompositeOperation = 'source-over';
    dCtx.lineWidth = 2;
}

/* ===== ARROW HANDLING ===== */
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
    
    // Track for undo
    arrowHistory.push({
        id: Date.now(),
        element: line,
        isArrow: true
    });
    // Add a marker to allStrokes so we know order of operations for Undo
    allStrokes.push({ type: 'arrow_marker', ref: line });
}

function updateArrow(x, y) {
    if (activeLine) {
        activeLine.setAttribute('x2', x);
        activeLine.setAttribute('y2', y);
    }
}

/* ===== TOUCH & GESTURES ===== */
let touches = {};
let lastTap = 0;

function handleTouchStart(e) {
    if (e.target.closest('.toolbar') || e.target.closest('#bottom-controls') || e.target.closest('#mode-status') || e.target.closest('.math-box')) {
        return;
    }
    e.preventDefault(); // Stop scrolling when drawing
    
    const touch = e.touches[0];
    const now = Date.now();
    
    // Double Tap detection
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
    if (e.target.closest('.toolbar')) return;
    e.preventDefault();
    
    if (e.touches.length === 1 && !isDraggingBox) {
        handleSingleTouchMove(e.touches[0]);
    } else if (e.touches.length === 2) {
        handlePinchMove(e.touches);
    }
}

function handleTouchEnd(e) {
    if (isDrawing || isDrawingArrow) {
        finishDrawing();
    }
    isPanning = false;
    isDrawing = false;
    isDrawingArrow = false;
    isDraggingBox = false;
    lastTouchDistance = 0;
}

function handleDoubleTap(touch) {
    const rect = canvasContainer.getBoundingClientRect();
    const x = (touch.clientX - rect.left - translateX) / scale;
    const y = (touch.clientY - rect.top - translateY) / scale;
    createMathBox(x, y);
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
        // Reset start so panning is smooth
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
        
        // Damping the zoom speed slightly for better control
        const delta = distance / lastTouchDistance;
        const newScale = Math.min(Math.max(scale * delta, 0.5), 3);
        
        // Math to zoom towards center of pinch
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

/* ===== MATH BOX HANDLING ===== */
function createMathBox(x, y, initialValue = '') {
    const container = document.createElement('div');
    container.className = 'math-box';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    
    // Handle
    const handle = document.createElement('div');
    handle.className = 'box-handle';
    container.appendChild(handle);
    
    // Close Button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-box-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.remove();
    });
    container.appendChild(closeBtn);
    
    // Display Area
    const display = document.createElement('div');
    display.className = 'math-display';
    display.dataset.latex = initialValue;
    container.appendChild(display);
    
    if (initialValue) {
        renderMathDisplay(display, initialValue);
    }
    
    // Edit on click
    display.addEventListener('click', () => {
        openTextInput(container, display);
    });
    
    setupDrag(handle, container);
    canvasArea.appendChild(container);
    return container;
}

function renderMathDisplay(display, latex) {
    // Basic rendering for preview
    display.innerHTML = '';
    const mf = document.createElement('math-field');
    mf.value = latex;
    mf.readOnly = true;
    display.appendChild(mf);
    display.dataset.latex = latex;
}

function setupDrag(handle, container) {
    let dragStartX, dragStartY, boxStartX, boxStartY;
    
    handle.addEventListener('touchstart', (e) => {
        if (currentTool !== 'pointer') return;
        e.stopPropagation(); // prevent canvas panning
        isDraggingBox = true;
        
        const touch = e.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        boxStartX = container.offsetLeft;
        boxStartY = container.offsetTop;
        
        document.querySelectorAll('.math-box').forEach(b => b.classList.remove('focused'));
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
}

/* ===== TEXT INPUT & SHORTCUTS ===== */
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
    
    // Matrix shortcuts (fast method)
    if (text.includes('mat') || text.includes('det')) {
         handleMatrixPatterns();
    }
}

function handleMatrixPatterns() {
    let text = textInputArea.value;
    // Simple fast regex check
    text = text.replace(/([1-9])([1-9])mat/g, (m, r, c) => generateStructure(r, c, 'pmatrix'));
    text = text.replace(/([1-9])([1-9])det/g, (m, r, c) => generateStructure(r, c, 'vmatrix'));
    
    if (text !== textInputArea.value) {
        textInputArea.value = text;
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
    // OPTIMIZED: Reuse Element
    let mf = latexPreview.querySelector('math-field');
    if (!mf) {
        mf = document.createElement('math-field');
        mf.readOnly = true;
        latexPreview.innerHTML = '';
        latexPreview.appendChild(mf);
    }
    mf.value = latex;
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
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ===== UTILS & EXPORT ===== */
function performUndo() {
    if (allStrokes.length === 0) {
        showToast('Nothing to undo');
        return;
    }
    
    const lastAction = allStrokes.pop();
    
    if (lastAction.type === 'arrow_marker') {
        if (lastAction.ref) lastAction.ref.remove();
    } else {
        // Redraw remaining canvas vector data
        redrawCanvas();
    }
    showToast('Undo');
}

function clearEditor() {
    if (!confirm('Clear everything?')) return;
    document.querySelectorAll('.math-box').forEach(b => b.remove());
    arrowLayer.innerHTML = '<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#4da6ff" /></marker></defs>';
    dCtx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
    allStrokes = [];
    showToast('Cleared');
}

function exportABLE() {
    const data = {
        format: 'ABLE_VECTOR', // New format
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
        strokes: allStrokes // Save vector data, not image!
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Note_Mobile_${Date.now()}.able`;
    a.click();
}

function importABLE(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const d = JSON.parse(ev.target.result);
            document.querySelectorAll('.math-box').forEach(b => b.remove());
            
            // Clear Arrows
            const defs = arrowLayer.querySelector('defs').outerHTML;
            arrowLayer.innerHTML = defs;

            // Load Boxes
            if(d.boxes) d.boxes.forEach(bx => createMathBox(bx.x, bx.y, bx.c));
            
            // Load Arrows
            if(d.arrows) d.arrows.forEach(ar => {
                const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                l.setAttribute('x1', ar.x1); l.setAttribute('y1', ar.y1);
                l.setAttribute('x2', ar.x2); l.setAttribute('y2', ar.y2);
                l.setAttribute('stroke', '#4da6ff'); l.setAttribute('stroke-width', '2');
                l.setAttribute('marker-end', 'url(#arrowhead)');
                arrowLayer.appendChild(l);
            });
            
            // Load Vector Strokes
            if (d.strokes) {
                allStrokes = d.strokes;
                redrawCanvas();
            } else if (d.draw) {
                // Legacy image support (fallback)
                const img = new Image();
                img.onload = () => dCtx.drawImage(img, 0, 0);
                img.src = d.draw;
            }
            showToast('Loaded!');
        } catch (err) {
            console.error(err);
            showToast('Error loading file');
        }
    };
    reader.readAsText(file);
}

async function exportToPDF() {
    showToast('Generating PDF...');
    document.querySelectorAll('.toolbar, #bottom-controls, #mode-status, #brand-header').forEach(el => el.style.visibility = 'hidden');
    try {
        const canvas = await html2canvas(canvasArea, { backgroundColor: '#1e1e1e', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`ABLE_Mobile_${Date.now()}.pdf`);
    } catch (err) {
        console.error(err);
    }
    document.querySelectorAll('.toolbar, #bottom-controls, #mode-status, #brand-header').forEach(el => el.style.visibility = 'visible');
    showToast('Done!');
}

function showToast(msg) {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2000);
}

// Start
window.addEventListener('load', init);
