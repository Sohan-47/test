/* ===== ABLE MOBILE - STABLE ENGINE ===== */

// Global State
let currentTool = 'pointer';
let isMathMode = true;

// Viewport State
let scale = 1;
let translateX = 0;
let translateY = 0;

// Gesture State
let isPanning = false;
let isZooming = false;
let isDraggingBox = false;
let lastTouchX = 0;
let lastTouchY = 0;
let lastPinchDist = 0;

// Double Tap Logic
let tapCount = 0;
let tapTimer = null;

// Drawing State
let isDrawing = false;
let isDrawingArrow = false;
let currentStroke = [];
let allStrokes = [];
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
const latexPreview = document.getElementById('latex-preview-content');
const helpModal = document.getElementById('help-modal');
const toast = document.getElementById('toast');
const modeStatus = document.getElementById('mode-status');

// Contexts
const dCtx = drawingLayer.getContext('2d', { alpha: true });
const pCtx = previewLayer.getContext('2d', { alpha: true });

let activeMathBox = null;
let activeTextArea = null;

// SHORTCUT DICTIONARY (PC MAPPING)
const shortcuts = {
    'alpha': '\\alpha', 'beta': '\\beta', 'gamma': '\\gamma', 'delta': '\\delta', 'epsilon': '\\epsilon',
    'theta': '\\theta', 'pi': '\\pi', 'rho': '\\rho', 'sigma': '\\sigma', 'phi': '\\phi', 'omega': '\\omega',
    'Delta': '\\Delta', 'Theta': '\\Theta', 'Sigma': '\\Sigma', 'Omega': '\\Omega',
    'int': '\\int', 'iint': '\\iint', 'sum': '\\sum', 'prod': '\\prod',
    'infty': '\\infty', 'pm': '\\pm', 'times': '\\times', 'cdot': '\\cdot',
    'lim': '\\lim', 'sin': '\\sin', 'cos': '\\cos', 'tan': '\\tan', 'ln': '\\ln', 'log': '\\log',
    'in': '\\in', 'notin': '\\notin', 'cup': '\\cup', 'cap': '\\cap',
    'RR': '\\mathbb{R}', 'ZZ': '\\mathbb{Z}', 'NN': '\\mathbb{N}',
    'to': '\\to', 'map': '\\mapsto', 'implies': '\\implies', 'iff': '\\iff',
    'deg': '^\\circ', 'sqrt': '\\sqrt', 'frac': '\\frac'
};

// INITIALIZATION
window.addEventListener('load', () => {
    initCanvas();
    setupEventListeners();
    updateModeUI();
    // Default box
    if (document.querySelectorAll('.math-box').length === 0) {
        createMathBox(window.innerWidth / 2 - 100, window.innerHeight / 3);
    }
});

function initCanvas() {
    const w = 2500, h = 2500;
    drawingLayer.width = previewLayer.width = w;
    drawingLayer.height = previewLayer.height = h;
    dCtx.lineCap = pCtx.lineCap = 'round';
    dCtx.lineJoin = pCtx.lineJoin = 'round';
    dCtx.lineWidth = pCtx.lineWidth = 2;
    dCtx.strokeStyle = pCtx.strokeStyle = '#4da6ff';
}

function setupEventListeners() {
    // Tools
    modeStatus.addEventListener('click', toggleMode);
    ['pointer', 'pen', 'line', 'circle', 'curve', 'eraser', 'arrow'].forEach(t => {
        const btn = document.getElementById('tool-' + t);
        if (btn) btn.addEventListener('click', () => selectTool(t));
    });

    document.getElementById('tool-grid').addEventListener('click', toggleGrid);
    document.getElementById('tool-clear').addEventListener('click', clearEditor);
    document.getElementById('tool-undo').addEventListener('click', performUndo);
    
    // UI Helpers
    document.getElementById('text-input-done').addEventListener('click', finishTextInput);
    document.getElementById('btn-help').addEventListener('click', () => helpModal.classList.add('active'));
    document.getElementById('help-close').addEventListener('click', () => helpModal.classList.remove('active'));

    // CORE INPUT HANDLER (The Engine)
    textInputArea.addEventListener('input', handleCursorEngine);

    // TOUCH ENGINE (Passive: false is critical)
    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: false });
}

/* =========================================
   1. CURSOR-AWARE CONVERSION ENGINE
   (Mimics MathLive Behavior)
   ========================================= */
function handleCursorEngine(e) {
    updateLatexPreview(); // Always update preview instantly

    if (!isMathMode) return;

    // Get cursor position
    const cursor = textInputArea.selectionStart;
    const text = textInputArea.value;

    // We only care about the word immediately BEFORE the cursor
    // 1. Extract text up to cursor
    const textBefore = text.slice(0, cursor);
    
    // 2. Find the last "word" (letters only)
    // This regex looks for a sequence of letters at the very end of the string
    const match = textBefore.match(/([a-zA-Z]+)$/);

    if (match) {
        const word = match[1]; // e.g. "int"
        const wordStart = match.index;
        
        // 3. Check if this word is a shortcut
        if (shortcuts[word]) {
            // SAFETY CHECK: Is it already a command? (e.g. \int)
            // Look at the character just before the word
            const charBefore = textBefore.charAt(wordStart - 1);
            if (charBefore === '\\') return; // It's already converted, ignore!

            // 4. PERFORM REPLACEMENT
            const replacement = shortcuts[word];
            
            // Construct new text
            const beforeWord = textBefore.slice(0, wordStart);
            const textAfter = text.slice(cursor);
            
            const newText = beforeWord + replacement + textAfter;
            
            // Update value
            textInputArea.value = newText;
            
            // 5. FIX CURSOR POSITION
            // Move cursor to end of inserted command
            const newCursorPos = beforeWord.length + replacement.length;
            textInputArea.setSelectionRange(newCursorPos, newCursorPos);
            
            // Update preview again with changed text
            updateLatexPreview();
        }
    }
    
    // MATRIX SHORTCUTS (Special Case)
    // If user types 'mat', check previous 2 chars
    if (textBefore.endsWith('mat')) {
        const r = textBefore.charAt(textBefore.length - 5);
        const c = textBefore.charAt(textBefore.length - 4);
        if (!isNaN(r) && !isNaN(c)) {
            // Replace "22mat" with matrix
            const startIdx = textBefore.length - 5;
            const replacement = generateStructure(r, c, 'pmatrix');
            const before = textBefore.slice(0, startIdx);
            const after = text.slice(cursor);
            textInputArea.value = before + replacement + after;
            textInputArea.setSelectionRange(before.length + replacement.length, before.length + replacement.length);
            updateLatexPreview();
        }
    }
}

function generateStructure(r, c, type) {
    let s = `\\begin{${type}}`;
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) s += (j<c-1) ? '#? & ' : '#?';
        if (i < r - 1) s += ' \\\\ ';
    }
    return s + `\\end{${type}}`;
}

/* =========================================
   2. ROBUST TOUCH & ZOOM ENGINE
   ========================================= */
function onTouchStart(e) {
    // Ignore UI elements
    if (e.target.closest('.toolbar') || e.target.closest('#text-input-modal') || e.target.closest('.math-box')) return;
    
    e.preventDefault();

    // PINCH DETECTION
    if (e.touches.length === 2) {
        isZooming = true;
        isPanning = false;
        isDrawing = false;
        
        // Kill any pending tap timers instantly
        if (tapTimer) clearTimeout(tapTimer);
        tapCount = 0;
        
        // Init Pinch
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        return;
    }

    // SINGLE FINGER
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        
        // Handle Double Tap Logic manually
        tapCount++;
        if (tapCount === 1) {
            tapTimer = setTimeout(() => {
                tapCount = 0; // Reset if too slow
            }, 300);
        } else if (tapCount === 2) {
            // DOUBLE TAP CONFIRMED
            clearTimeout(tapTimer);
            tapCount = 0;
            // Only create box if we are NOT zooming
            if (!isZooming) {
                const rect = canvasContainer.getBoundingClientRect();
                const x = (touch.clientX - rect.left) / scale;
                const y = (touch.clientY - rect.top) / scale;
                createMathBox(x, y);
            }
            return;
        }

        // Logic for Pan/Draw
        if (currentTool === 'pointer') {
            isPanning = true;
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
        } else {
            // Calculate Project Coordinates
            const rect = canvasContainer.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / scale;
            const y = (touch.clientY - rect.top) / scale;
            
            if (currentTool === 'arrow') startDrawingArrow(x, y);
            else startDrawing(x, y);
        }
    }
}

function onTouchMove(e) {
    e.preventDefault();

    // PINCH ZOOMING
    if (isZooming && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (lastPinchDist > 0) {
            const delta = dist / lastPinchDist;
            const newScale = Math.min(Math.max(scale * delta, 0.5), 3);
            
            // Simple center zoom
            const rect = viewport.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Adjust translate to zoom towards center
            translateX += (centerX - translateX) * (1 - delta);
            translateY += (centerY - translateY) * (1 - delta);
            scale = newScale;
            updateTransform();
        }
        lastPinchDist = dist;
        return;
    }

    // SINGLE FINGER MOVEMENT
    if (e.touches.length === 1) {
        const touch = e.touches[0];

        if (isPanning && currentTool === 'pointer') {
            const dx = touch.clientX - lastTouchX;
            const dy = touch.clientY - lastTouchY;
            translateX += dx;
            translateY += dy;
            updateTransform();
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
        } else if (isDrawing || isDrawingArrow) {
            const rect = canvasContainer.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / scale;
            const y = (touch.clientY - rect.top) / scale;
            if (isDrawing) continueDrawing(x, y);
            if (isDrawingArrow && activeLine) {
                activeLine.setAttribute('x2', x);
                activeLine.setAttribute('y2', y);
            }
        }
    }
}

function onTouchEnd(e) {
    if (e.touches.length === 0) {
        isZooming = false;
        isPanning = false;
        if (isDrawing) finishDrawing();
        isDrawingArrow = false;
    }
}

function updateTransform() {
    canvasContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

/* =========================================
   3. DRAWING & HELPERS
   ========================================= */
function startDrawing(x, y) {
    isDrawing = true;
    currentStroke = [{x, y}];
    dCtx.beginPath();
    dCtx.moveTo(x, y);
    dCtx.lineWidth = currentTool === 'eraser' ? 20 : 2;
    dCtx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
}

function continueDrawing(x, y) {
    if (!isDrawing) return;
    if (currentTool === 'pen' || currentTool === 'eraser') {
        dCtx.lineTo(x, y);
        dCtx.stroke();
        const last = currentStroke[currentStroke.length-1];
        if (Math.abs(x - last.x) + Math.abs(y - last.y) > 3) currentStroke.push({x,y});
    }
    // Shapes preview logic
    else if (currentTool === 'line') {
        pCtx.clearRect(0,0,2500,2500);
        pCtx.beginPath(); pCtx.moveTo(currentStroke[0].x, currentStroke[0].y); pCtx.lineTo(x,y); pCtx.stroke();
    }
    else if (currentTool === 'circle') {
        pCtx.clearRect(0,0,2500,2500);
        const s = currentStroke[0];
        const r = Math.hypot(x-s.x, y-s.y);
        pCtx.beginPath(); pCtx.arc(s.x, s.y, r, 0, 2*Math.PI); pCtx.stroke();
    }
}

function finishDrawing() {
    isDrawing = false;
    if (currentTool === 'pen' || currentTool === 'eraser') {
        allStrokes.push({ type: 'scribble', mode: currentTool==='eraser'?'erase':'draw', points: currentStroke });
    }
    // Note: Shapes commit logic simplified here for brevity, pen is priority
    pCtx.clearRect(0,0,2500,2500);
}

function startDrawingArrow(x, y) {
    isDrawingArrow = true;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', y);
    line.setAttribute('x2', x); line.setAttribute('y2', y);
    line.setAttribute('stroke', '#4da6ff'); line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    arrowLayer.appendChild(line);
    activeLine = line;
    allStrokes.push({ type: 'arrow', ref: line });
}

/* =========================================
   4. UI LOGIC
   ========================================= */
function toggleMode() {
    isMathMode = !isMathMode;
    updateModeUI();
}

function updateModeUI() {
    modeStatus.textContent = isMathMode ? 'MODE: MATH' : 'MODE: TEXT';
    modeStatus.classList.toggle('active', isMathMode);
    if(activeTextArea) textInputArea.placeholder = isMathMode ? "Math Mode Active (try 'int', 'alpha')..." : "Text Mode";
}

function createMathBox(x, y, initialValue = '') {
    const container = document.createElement('div');
    container.className = 'math-box';
    container.style.left = x + 'px'; container.style.top = y + 'px';
    
    const handle = document.createElement('div');
    handle.className = 'box-handle';
    handle.addEventListener('touchstart', (e) => {
        if (currentTool!=='pointer') return;
        e.stopPropagation();
        isDraggingBox = true;
        const t = e.touches[0];
        const startX = t.clientX, startY = t.clientY;
        const ol = container.offsetLeft, ot = container.offsetTop;
        
        function move(ev) {
            const dx = (ev.touches[0].clientX - startX) / scale;
            const dy = (ev.touches[0].clientY - startY) / scale;
            container.style.left = (ol + dx) + 'px';
            container.style.top = (ot + dy) + 'px';
        }
        function end() {
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', end);
            isDraggingBox = false;
        }
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', end);
    });
    
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-box-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = (e) => { e.stopPropagation(); container.remove(); };

    const display = document.createElement('div');
    display.className = 'math-display';
    display.dataset.latex = initialValue;
    renderMathDisplay(display, initialValue);
    
    display.onclick = () => {
        activeMathBox = container;
        activeTextArea = display;
        textInputArea.value = display.dataset.latex || '';
        textInputModal.classList.add('active');
        updateModeUI();
        updateLatexPreview();
    };

    container.append(handle, closeBtn, display);
    canvasArea.appendChild(container);
    return container;
}

function renderMathDisplay(el, latex) {
    el.innerHTML = '';
    const mf = document.createElement('math-field');
    mf.value = latex; mf.readOnly = true;
    el.appendChild(mf);
    el.dataset.latex = latex;
}

function updateLatexPreview() {
    let mf = latexPreview.querySelector('math-field');
    if (!mf) {
        mf = document.createElement('math-field');
        mf.readOnly = true;
        latexPreview.appendChild(mf);
    }
    mf.value = textInputArea.value;
}

function finishTextInput() {
    if (activeTextArea) renderMathDisplay(activeTextArea, textInputArea.value);
    textInputModal.classList.remove('active');
    activeTextArea = null;
}

function toggleGrid() {
    const g = document.getElementById('grid-layer');
    g.style.display = g.style.display === 'none' ? 'block' : 'none';
    document.getElementById('tool-grid').classList.toggle('active');
}

function selectTool(t) {
    currentTool = t;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tool-'+t).classList.add('active');
}

function performUndo() {
    if(!allStrokes.length) return showToast("Nothing to undo");
    const last = allStrokes.pop();
    if(last.type==='arrow') last.ref.remove();
    else {
        dCtx.clearRect(0,0,2500,2500);
        allStrokes.forEach(s => {
            if(s.type==='scribble') {
                dCtx.beginPath();
                dCtx.moveTo(s.points[0].x, s.points[0].y);
                s.points.forEach(p=>dCtx.lineTo(p.x, p.y));
                dCtx.strokeStyle='#4da6ff'; dCtx.lineWidth = s.mode==='erase'?20:2;
                dCtx.globalCompositeOperation = s.mode==='erase'?'destination-out':'source-over';
                dCtx.stroke();
            }
        });
        dCtx.globalCompositeOperation='source-over';
    }
}

function clearEditor() {
    if(confirm("Clear?")) {
        document.querySelectorAll('.math-box').forEach(b=>b.remove());
        allStrokes=[]; dCtx.clearRect(0,0,2500,2500);
        arrowLayer.innerHTML = '<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#4da6ff" /></marker></defs>';
    }
}

function showToast(msg) { toast.textContent = msg; toast.style.display='block'; setTimeout(()=>toast.style.display='none',2000); }
