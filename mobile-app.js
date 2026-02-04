/* ===== ABLE MOBILE - SMART ENGINE v2 ===== */

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

// === SMART SHORTCUTS ===
// '•' is the Placeholder. The cursor will jump to the first '•' it finds.
const shortcuts = {
    // Greek
    'alpha': '\\alpha', 'beta': '\\beta', 'gamma': '\\gamma', 'delta': '\\delta', 'epsilon': '\\epsilon',
    'theta': '\\theta', 'pi': '\\pi', 'rho': '\\rho', 'sigma': '\\sigma', 'phi': '\\phi', 'omega': '\\omega',
    'Delta': '\\Delta', 'Theta': '\\Theta', 'Sigma': '\\Sigma', 'Omega': '\\Omega', 'grad': '\\nabla',
    
    // Calculus
    'int': '\\int', 
    'dint': '\\int_{•}^{•}', // Definite Integral with jumps
    'iint': '\\iint', 'sum': '\\sum_{•}^{•}', 'prod': '\\prod_{•}^{•}',
    'lim': '\\lim_{• \\to •}', 
    'part': '\\partial', 'diff': '\\frac{d•}{d•}', 'pdiff': '\\frac{\\partial •}{\\partial •}',

    // Operations
    'fr': '\\frac{•}{•}', 'frac': '\\frac{•}{•}',
    'sq': '\\sqrt{•}', 'sqrt': '\\sqrt{•}',
    'pow': '^{•}',
    
    // Logic/Sets
    'in': '\\in', 'notin': '\\notin', 'cup': '\\cup', 'cap': '\\cap',
    'RR': '\\mathbb{R}', 'ZZ': '\\mathbb{Z}', 'NN': '\\mathbb{N}',
    'to': '\\to', 'map': '\\mapsto', 'implies': '\\implies', 'iff': '\\iff',
    
    // Vectors & Accents (The "Smart" Macros)
    'vec': '\\vec{•}', 
    'hat': '\\hat{•}', 
    'bar': '\\bar{•}',
    'dot': '\\dot{•}',
    'gradvec': '\\vec{\\nabla}', // Specific User Request
    
    // Misc
    'inf': '\\infty', 'ify': '\\infty', 
    'pm': '\\pm', 'xx': '\\times', 'cdot': '\\cdot'
};

// INITIALIZATION
window.addEventListener('load', () => {
    initCanvas();
    setupEventListeners();
    updateModeUI();
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
    modeStatus.addEventListener('click', toggleMode);
    ['pointer', 'pen', 'line', 'circle', 'curve', 'eraser', 'arrow'].forEach(t => {
        const btn = document.getElementById('tool-' + t);
        if (btn) btn.addEventListener('click', () => selectTool(t));
    });

    document.getElementById('tool-grid').addEventListener('click', toggleGrid);
    document.getElementById('tool-clear').addEventListener('click', clearEditor);
    document.getElementById('tool-undo').addEventListener('click', performUndo);
    
    // Text Input Events
    document.getElementById('text-input-done').addEventListener('click', finishTextInput);
    textInputArea.addEventListener('input', handleCursorEngine);
    
    // Touch Events
    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: false });
    
    // Help Modal
    document.getElementById('btn-help').addEventListener('click', () => helpModal.classList.add('active'));
    document.getElementById('help-close').addEventListener('click', () => helpModal.classList.remove('active'));
}

/* =========================================
   1. SMART EXPANSION ENGINE
   ========================================= */
function handleCursorEngine(e) {
    // 1. Always update preview immediately so user sees what they typed
    updateLatexPreview();
    
    if (!isMathMode) return;

    const cursor = textInputArea.selectionStart;
    const text = textInputArea.value;
    const textBefore = text.slice(0, cursor);
    
    // Regex: Match the "word" ending exactly at the cursor
    // This allows "int" to match, but "print" (ending in int) to NOT match if we check boundaries carefully.
    // However, for speed, we usually just match the suffix.
    // We add a check: char before match must be non-letter or empty.
    const match = textBefore.match(/([a-zA-Z0-9]+)$/);

    if (match) {
        const word = match[1];
        const wordStart = match.index;
        
        // --- A. PATTERN MATCHING (Matrices) ---
        // Matches "32mat" or "22det"
        if (word.match(/^[1-9][1-9](mat|det)$/)) {
            const rows = parseInt(word[0]);
            const cols = parseInt(word[1]);
            const type = word.endsWith('mat') ? 'pmatrix' : 'vmatrix';
            
            replaceWithStructure(rows, cols, type, wordStart, cursor, text);
            return;
        }

        // --- B. DICTIONARY MATCHING ---
        if (shortcuts[word]) {
            // Safety: Don't replace if it's already a command (preceded by backslash)
            const charBefore = textBefore.charAt(wordStart - 1);
            if (charBefore === '\\') return;

            // Perform Replacement
            const replacement = shortcuts[word];
            performReplacement(wordStart, cursor, text, replacement);
        }
    }
}

function performReplacement(start, end, fullText, replacementTemplate) {
    // 1. Analyze Template
    // We look for '•' which indicates where the cursor should jump.
    const firstPlaceholderIndex = replacementTemplate.indexOf('•');
    
    // 2. Clean Template for insertion (remove the placeholder marker)
    // If we have a placeholder, we remove ONE of them to put the cursor there.
    // Actually, usually we keep the placeholder EMPTY.
    // Strategy: Remove the '•' character, place cursor at that index.
    
    let finalTextToInsert = replacementTemplate;
    let jumpOffset = replacementTemplate.length; // Default: jump to end
    
    if (firstPlaceholderIndex !== -1) {
        // Remove the first •
        finalTextToInsert = replacementTemplate.replace('•', ''); 
        jumpOffset = firstPlaceholderIndex;
    }

    // 3. Construct new text
    const textBefore = fullText.slice(0, start);
    const textAfter = fullText.slice(end);
    
    textInputArea.value = textBefore + finalTextToInsert + textAfter;
    
    // 4. Set Cursor Position
    const newCursorPos = textBefore.length + jumpOffset;
    textInputArea.setSelectionRange(newCursorPos, newCursorPos);
    
    // 5. Update Preview
    updateLatexPreview();
}

function replaceWithStructure(rows, cols, type, start, end, fullText) {
    let s = `\\begin{${type}}`;
    // We put a placeholder • in the very first cell
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (i===0 && j===0) s += '•'; // Cursor target
            else s += ' '; // Empty cells
            
            if (j < cols - 1) s += ' & ';
        }
        if (i < rows - 1) s += ' \\\\ ';
    }
    s += `\\end{${type}}`;
    
    performReplacement(start, end, fullText, s);
}

/* =========================================
   2. GESTURES & ZOOM (Stable)
   ========================================= */
function onTouchStart(e) {
    if (e.target.closest('.toolbar') || e.target.closest('#text-input-modal') || e.target.closest('.math-box')) return;
    e.preventDefault();

    if (e.touches.length === 2) {
        isZooming = true;
        isPanning = false; isDrawing = false;
        if (tapTimer) clearTimeout(tapTimer);
        tapCount = 0;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        return;
    }

    if (e.touches.length === 1) {
        const touch = e.touches[0];
        tapCount++;
        if (tapCount === 1) {
            tapTimer = setTimeout(() => { tapCount = 0; }, 300);
        } else if (tapCount === 2) {
            clearTimeout(tapTimer); tapCount = 0;
            if (!isZooming) {
                const rect = canvasContainer.getBoundingClientRect();
                createMathBox((touch.clientX - rect.left)/scale, (touch.clientY - rect.top)/scale);
            }
            return;
        }

        if (currentTool === 'pointer') {
            isPanning = true;
            lastTouchX = touch.clientX; lastTouchY = touch.clientY;
        } else {
            const rect = canvasContainer.getBoundingClientRect();
            const x = (touch.clientX - rect.left)/scale;
            const y = (touch.clientY - rect.top)/scale;
            if (currentTool === 'arrow') startDrawingArrow(x, y);
            else startDrawing(x, y);
        }
    }
}

function onTouchMove(e) {
    e.preventDefault();
    if (isZooming && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist > 0) {
            const delta = dist / lastPinchDist;
            const newScale = Math.min(Math.max(scale * delta, 0.5), 3);
            const rect = viewport.getBoundingClientRect();
            translateX += (rect.width/2 - translateX) * (1 - delta);
            translateY += (rect.height/2 - translateY) * (1 - delta);
            scale = newScale;
            updateTransform();
        }
        lastPinchDist = dist;
        return;
    }

    if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (isPanning && currentTool === 'pointer') {
            translateX += touch.clientX - lastTouchX;
            translateY += touch.clientY - lastTouchY;
            updateTransform();
            lastTouchX = touch.clientX; lastTouchY = touch.clientY;
        } else if (isDrawing || isDrawingArrow) {
            const rect = canvasContainer.getBoundingClientRect();
            const x = (touch.clientX - rect.left)/scale;
            const y = (touch.clientY - rect.top)/scale;
            if (isDrawing) continueDrawing(x, y);
            if (isDrawingArrow && activeLine) { activeLine.setAttribute('x2', x); activeLine.setAttribute('y2', y); }
        }
    }
}

function onTouchEnd(e) {
    if (e.touches.length === 0) {
        isZooming = false; isPanning = false; isDrawingArrow = false;
        if (isDrawing) finishDrawing();
    }
}

function updateTransform() { canvasContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`; }

/* =========================================
   3. DRAWING & UTILS
   ========================================= */
function startDrawing(x, y) {
    isDrawing = true; currentStroke = [{x, y}];
    dCtx.beginPath(); dCtx.moveTo(x, y);
    dCtx.lineWidth = currentTool === 'eraser' ? 20 : 2;
    dCtx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
}

function continueDrawing(x, y) {
    if (!isDrawing) return;
    if (currentTool === 'pen' || currentTool === 'eraser') {
        dCtx.lineTo(x, y); dCtx.stroke();
        const last = currentStroke[currentStroke.length-1];
        if (Math.abs(x - last.x) + Math.abs(y - last.y) > 3) currentStroke.push({x,y});
    }
    else if (currentTool === 'line') {
        pCtx.clearRect(0,0,2500,2500); pCtx.beginPath(); pCtx.moveTo(currentStroke[0].x, currentStroke[0].y); pCtx.lineTo(x,y); pCtx.stroke();
    }
    else if (currentTool === 'circle') {
        pCtx.clearRect(0,0,2500,2500);
        const s = currentStroke[0]; const r = Math.hypot(x-s.x, y-s.y);
        pCtx.beginPath(); pCtx.arc(s.x, s.y, r, 0, 2*Math.PI); pCtx.stroke();
    }
}

function finishDrawing() {
    isDrawing = false;
    if (currentTool === 'pen' || currentTool === 'eraser') allStrokes.push({ type: 'scribble', mode: currentTool==='eraser'?'erase':'draw', points: currentStroke });
    pCtx.clearRect(0,0,2500,2500);
}

function startDrawingArrow(x, y) {
    isDrawingArrow = true;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', y); line.setAttribute('x2', x); line.setAttribute('y2', y);
    line.setAttribute('stroke', '#4da6ff'); line.setAttribute('stroke-width', '2'); line.setAttribute('marker-end', 'url(#arrowhead)');
    arrowLayer.appendChild(line);
    activeLine = line;
    allStrokes.push({ type: 'arrow', ref: line });
}

function toggleMode() { isMathMode = !isMathMode; updateModeUI(); }
function updateModeUI() {
    modeStatus.textContent = isMathMode ? 'MODE: MATH' : 'MODE: TEXT';
    modeStatus.classList.toggle('active', isMathMode);
    if(activeTextArea) textInputArea.placeholder = isMathMode ? "Math Mode (try 'vec', '32mat')..." : "Text Mode";
}

function createMathBox(x, y, initialValue = '') {
    const container = document.createElement('div');
    container.className = 'math-box'; container.style.left = x + 'px'; container.style.top = y + 'px';
    
    const handle = document.createElement('div'); handle.className = 'box-handle';
    handle.addEventListener('touchstart', (e) => {
        if (currentTool!=='pointer') return;
        e.stopPropagation(); isDraggingBox = true;
        const t = e.touches[0]; const startX = t.clientX, startY = t.clientY;
        const ol = container.offsetLeft, ot = container.offsetTop;
        function move(ev) { container.style.left = (ol + (ev.touches[0].clientX - startX)/scale) + 'px'; container.style.top = (ot + (ev.touches[0].clientY - startY)/scale) + 'px'; }
        function end() { window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end); isDraggingBox = false; }
        window.addEventListener('touchmove', move); window.addEventListener('touchend', end);
    });
    
    const closeBtn = document.createElement('div'); closeBtn.className = 'close-box-btn'; closeBtn.innerHTML = '&times;';
    closeBtn.onclick = (e) => { e.stopPropagation(); container.remove(); };

    const display = document.createElement('div'); display.className = 'math-display';
    renderMathDisplay(display, initialValue || '');
    
    display.onclick = () => {
        activeMathBox = container; activeTextArea = display;
        textInputArea.value = display.dataset.latex || '';
        textInputModal.classList.add('active');
        updateModeUI(); updateLatexPreview();
    };

    container.append(handle, closeBtn, display);
    canvasArea.appendChild(container);
    return container;
}

function renderMathDisplay(el, latex) {
    el.innerHTML = '';
    const mf = document.createElement('math-field');
    mf.value = latex; mf.readOnly = true;
    el.appendChild(mf); el.dataset.latex = latex;
}

function updateLatexPreview() {
    let mf = latexPreview.querySelector('math-field');
    if (!mf) { mf = document.createElement('math-field'); mf.readOnly = true; latexPreview.appendChild(mf); }
    // Clean visible placeholders for preview
    mf.value = textInputArea.value.replace(/•/g, ''); 
}

function finishTextInput() {
    if (activeTextArea) renderMathDisplay(activeTextArea, textInputArea.value.replace(/•/g, ''));
    textInputModal.classList.remove('active'); activeTextArea = null;
}

function toggleGrid() { const g = document.getElementById('grid-layer'); g.style.display = g.style.display === 'none' ? 'block' : 'none'; document.getElementById('tool-grid').classList.toggle('active'); }
function selectTool(t) { currentTool = t; document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active')); document.getElementById('tool-'+t).classList.add('active'); }

function performUndo() {
    if(!allStrokes.length) return showToast("Nothing to undo");
    const last = allStrokes.pop();
    if(last.type==='arrow') last.ref.remove();
    else {
        dCtx.clearRect(0,0,2500,2500);
        allStrokes.forEach(s => {
            if(s.type==='scribble') {
                dCtx.beginPath(); dCtx.moveTo(s.points[0].x, s.points[0].y);
                s.points.forEach(p=>dCtx.lineTo(p.x, p.y));
                dCtx.lineWidth = s.mode==='erase'?20:2; dCtx.globalCompositeOperation = s.mode==='erase'?'destination-out':'source-over';
                dCtx.stroke();
            }
        });
        dCtx.globalCompositeOperation='source-over';
    }
}

function clearEditor() { if(confirm("Clear?")) { document.querySelectorAll('.math-box').forEach(b=>b.remove()); allStrokes=[]; dCtx.clearRect(0,0,2500,2500); arrowLayer.innerHTML = '<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#4da6ff" /></marker></defs>'; } }
function showToast(msg) { toast.textContent = msg; toast.style.display='block'; setTimeout(()=>toast.style.display='none',2000); }
