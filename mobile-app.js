/* ===== ABLE MOBILE - PRO ENGINE (Context-Aware) ===== */

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

/* =========================================
   SHORTCUT DICTIONARY
   #@ = Cursor Placeholder
   ========================================= */
const shortcuts = {
    // Greek
    'alpha': '\\alpha', 'beta': '\\beta', 'gamma': '\\gamma', 'delta': '\\delta', 'epsilon': '\\epsilon',
    'vepsilon': '\\varepsilon', 'zeta': '\\zeta', 'eta': '\\eta', 'theta': '\\theta', 'vtheta': '\\vartheta',
    'iota': '\\iota', 'kappa': '\\kappa', 'lambda': '\\lambda', 'mu': '\\mu', 'nu': '\\nu', 'xi': '\\xi',
    'pi': '\\pi', 'rho': '\\rho', 'vrho': '\\varrho', 'sigma': '\\sigma', 'tau': '\\tau', 'upsilon': '\\upsilon',
    'phi': '\\phi', 'vphi': '\\varphi', 'chi': '\\chi', 'psi': '\\psi', 'omega': '\\omega',
    'Gamma': '\\Gamma', 'Delta': '\\Delta', 'Theta': '\\Theta', 'Lambda': '\\Lambda', 'Xi': '\\Xi',
    'Pi': '\\Pi', 'Sigma': '\\Sigma', 'Upsilon': '\\Upsilon', 'Phi': '\\Phi', 'Psi': '\\Psi', 'Omega': '\\Omega',
    
    // Logic & Sets
    'ify': '\\infty', 'pm': '\\pm', 'grad': '\\nabla', 'del': '\\partial', 'xx': '\\times', 'ast': '\\cdot', 'times': '\\times',
    'tf': '\\therefore', 'bc': '\\because', 'and': '\\land', 'or': '\\lor', 'not': '\\neg', 'eqv': '\\equiv',
    'sim': '\\sim', 'approx': '\\approx', 'prop': '\\propto', 'LL': '\\ll', 'GG': '\\gg', 'AA': '\\forall', 'EE': '\\exists',
    'ale': '\\aleph', 'bet': '\\beth', 'dal': '\\daleth', 'mscr': '\\mathscr{#@}', 'in': '\\in', 'notin': '\\notin', 'uu': '\\cup', 'nn': '\\cap',
    'sub': '\\subset', 'sup': '\\supset', 'sube': '\\subseteq', 'supe': '\\supseteq', 'eset': '\\emptyset',
    'RR': '\\mathbb{R}', 'ZZ': '\\mathbb{Z}', 'NN': '\\mathbb{N}', 'CC': '\\mathbb{C}', 'QQ': '\\mathbb{Q}',
    
    // Calculus & Structs
    'int': '\\int', 'dint': '\\int_{#@}^{#@}', 'iint': '\\iint', 'iiint': '\\iiint', 'oint': '\\oint', 'oiint': '\\oiint', 'oiiint': '\\oiiint',
    'prod': '\\prod_{#@}^{#@}', 'sum': '\\sum_{#@}^{#@}', 'bcap': '\\bigcap', 'bcup': '\\bigcup', 'bop': '\\bigoplus', 'bot': '\\bigotimes',
    'asin': '\\arcsin', 'acos': '\\arccos', 'atan': '\\arctan', 'sinh': '\\sinh', 'cosh': '\\cosh', 'log': '\\log_{#@}{#@}', 'ln': '\\ln{#@}',
    'lim': '\\lim_{#@ \\to #@}', 'fr': '\\frac{#@}{#@}', 'rt': '\\sqrt{#@}',
    
    // Accents & Wrappers (Context Aware)
    'vec': '\\vec{#@}', 'hat': '\\hat{#@}', 'bar': '\\bar{#@}', 'dot': '\\dot{#@}', 'ddot': '\\ddot{#@}', 'dddot': '\\dddot{#@}', 'tilde': '\\tilde{#@}',
    'bra': '\\bra{#@}', 'ket': '\\ket{#@}', 'braket': '\\braket{#@ | #@}', 'hatH': '\\hat{H}', 'dag': '\\dagger', 'hbar': '\\hbar', 'ell': '\\ell',
    
    // Layout
    'can': '\\cancel{#@}', 'box': '\\boxed{#@}', 'obra': '\\overbrace{#@}^{#@}', 'ubra': '\\underbrace{#@}_{#@}',
    
    // Geometry/Arrows
    'ang': '\\angle', 'perp': '\\perp', 'para': '\\parallel', 'tri': '\\triangle', 'sq': '\\square', 'deg': '^\\circ', '||': '\\| #@ \\|',
    '^T': '^{T}', 'impl': '\\implies', 'iff': '\\iff', 'ib': '\\impliedby', 'up': '\\uparrow', 'dn': '\\downarrow', 'lr': '\\leftrightarrow', 'map': '\\mapsto',
    'har': '\\rightleftharpoons', 'mcal': '\\mathcal{#@}', 'mfr': '\\mathfrak{#@}', 'mtt': '\\mathtt{#@}', 'mbf': '\\mathbf{#@}', 'mit': '\\mathit{#@}'
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
    // 1. DISABLE VIRTUAL KEYBOARD INTERFERENCE
    // This stops GBoard/iOS from trying to "predict" your math
    textInputArea.setAttribute('autocomplete', 'off');
    textInputArea.setAttribute('autocorrect', 'off');
    textInputArea.setAttribute('autocapitalize', 'off');
    textInputArea.setAttribute('spellcheck', 'false');

    modeStatus.addEventListener('click', toggleMode);
    ['pointer', 'pen', 'line', 'circle', 'curve', 'eraser', 'arrow'].forEach(t => {
        const btn = document.getElementById('tool-' + t);
        if (btn) btn.addEventListener('click', () => selectTool(t));
    });

    document.getElementById('tool-grid').addEventListener('click', toggleGrid);
    document.getElementById('tool-clear').addEventListener('click', clearEditor);
    document.getElementById('tool-undo').addEventListener('click', performUndo);
    
    document.getElementById('text-input-done').addEventListener('click', finishTextInput);
    
    // THE SMART ENGINE LISTENER
    textInputArea.addEventListener('input', handleSmartEngine);
    
    // Gestures
    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: false });
    
    document.getElementById('btn-help').addEventListener('click', () => helpModal.classList.add('active'));
    document.getElementById('help-close').addEventListener('click', () => helpModal.classList.remove('active'));
    document.getElementById('btn-export-able').addEventListener('click', exportABLE);
    document.getElementById('btn-import-able').addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('btn-export-pdf').addEventListener('click', exportToPDF);
    document.getElementById('file-input').addEventListener('change', importABLE);
}

/* =========================================
   1. CONTEXT-AWARE SMART ENGINE
   ========================================= */
function handleSmartEngine(e) {
    updateLatexPreview();
    if (!isMathMode) return;

    const cursor = textInputArea.selectionStart;
    const text = textInputArea.value;
    const textBefore = text.slice(0, cursor);
    
    // Capture the word immediately ending at cursor
    // This finds "grad" or "vec" or "32mat"
    const match = textBefore.match(/([a-zA-Z0-9^]+)$/);

    if (match) {
        const word = match[1];
        const wordStart = match.index;
        
        // --- PATTERN 1: MATRIX (e.g., 32mat) ---
        if (word.match(/^[1-9][1-9](mat|det)$/)) {
            const rows = parseInt(word[0]);
            const cols = parseInt(word[1]);
            const type = word.endsWith('mat') ? 'pmatrix' : 'vmatrix';
            insertMatrix(rows, cols, type, wordStart, cursor, text);
            return;
        }

        // --- PATTERN 2: DICTIONARY SHORTCUTS ---
        if (shortcuts[word]) {
            // Guard: Don't expand if already part of a command (e.g. \vec)
            if (textBefore.charAt(wordStart - 1) === '\\') return;

            const template = shortcuts[word];
            
            // CONTEXT CHECK: Is this an accent/wrapper? (e.g. \vec{#@})
            // And is there something immediately before it to wrap?
            if (template.includes('#@')) {
                // Look at text BEFORE the current word (stripped of trailing spaces from the slice)
                const textPreWord = textBefore.slice(0, wordStart);
                
                // Regex to find the "Atom" before the current word.
                // It looks for EITHER a latex command (\nabla) OR a single char (x)
                // It specifically checks the END of textPreWord
                const atomRegex = /(\\[a-zA-Z]+|[a-zA-Z0-9])$/;
                const atomMatch = textPreWord.match(atomRegex);

                // Only wrap if the atom is IMMEDIATE (no space in between)
                // If user types "x vec", textPreWord ends in space -> no match -> no wrap
                // If user types "xvec", textPreWord ends in "x" -> match -> wrap
                if (atomMatch) {
                    // WRAPPING MODE
                    // e.g. Input: "gradvec" -> textBefore is "...\nablavec"
                    // Match "vec" -> wordStart is at 'v'
                    // textPreWord is "...\nabla"
                    // atomMatch finds "\nabla"
                    
                    const atom = atomMatch[0]; // e.g. \nabla
                    const atomStart = atomMatch.index;
                    
                    // Replace the template's placeholder with the atom
                    // template: "\vec{#@}" -> "\vec{\nabla}"
                    const wrapped = template.replace('#@', atom);
                    
                    // Construct new text
                    // 1. Everything before the Atom
                    const prefix = textPreWord.slice(0, atomStart);
                    // 2. The Wrapped result
                    // 3. Everything after the cursor
                    const suffix = text.slice(cursor);
                    
                    textInputArea.value = prefix + wrapped + suffix;
                    
                    // Move Cursor to END of wrapper (Standard PC behavior)
                    const newPos = prefix.length + wrapped.length;
                    textInputArea.setSelectionRange(newPos, newPos);
                    updateLatexPreview();
                    return;
                }
            }

            // STANDARD REPLACEMENT (No wrapping)
            performReplacement(wordStart, cursor, text, template);
        }
    }
}

function performReplacement(start, end, fullText, template) {
    // 1. Handle Placeholder Logic
    let insertText = template;
    let jumpOffset = template.length;

    // Check for placeholders #@
    const phIndex = template.indexOf('#@');
    if (phIndex !== -1) {
        // Remove the FIRST placeholder to denote cursor position
        insertText = template.replace('#@', ''); 
        jumpOffset = phIndex;
    }

    // 2. Insert
    const before = fullText.slice(0, start);
    const after = fullText.slice(end);
    textInputArea.value = before + insertText + after;

    // 3. Position Cursor
    const newPos = before.length + jumpOffset;
    textInputArea.setSelectionRange(newPos, newPos);
    
    updateLatexPreview();
}

function insertMatrix(r, c, type, start, end, fullText) {
    let s = `\\begin{${type}}`;
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            if (i===0 && j===0) s += '#@'; // Cursor Target
            else s += ' '; 
            if (j < c - 1) s += ' & ';
        }
        if (i < r - 1) s += ' \\\\ ';
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
    if(activeTextArea) textInputArea.placeholder = isMathMode ? "Math Mode (try 'gradvec', '32mat')..." : "Text Mode";
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
    // Clean placeholders for preview
    mf.value = textInputArea.value.replace(/#@/g, ''); 
}

function finishTextInput() {
    if (activeTextArea) renderMathDisplay(activeTextArea, textInputArea.value.replace(/#@/g, ''));
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

// EXPORT/IMPORT
async function exportToPDF() {
    showToast('Generating PDF...');
    document.querySelectorAll('.toolbar, #bottom-controls, #mode-status, #brand-header').forEach(el => el.style.visibility = 'hidden');
    try {
        const canvas = await html2canvas(canvasArea, { backgroundColor: '#1e1e1e', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`ABLE_Mobile_${Date.now()}.pdf`);
        showToast('PDF Exported!');
    } catch (err) { console.error(err); showToast('Export Failed'); }
    document.querySelectorAll('.toolbar, #bottom-controls, #mode-status, #brand-header').forEach(el => el.style.visibility = 'visible');
}

function exportABLE() { 
    const data = {
        format: 'ABLE_VECTOR', 
        boxes: Array.from(document.querySelectorAll('.math-box')).map(b => ({
            x: b.offsetLeft, y: b.offsetTop, c: b.querySelector('.math-display').dataset.latex || ''
        })),
        arrows: Array.from(arrowLayer.querySelectorAll('line')).map(l => ({
            x1: l.getAttribute('x1'), y1: l.getAttribute('y1'), x2: l.getAttribute('x2'), y2: l.getAttribute('y2')
        })),
        strokes: allStrokes
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Note_Mobile_${Date.now()}.able`; a.click();
}

function importABLE(e) { 
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const d = JSON.parse(ev.target.result);
            document.querySelectorAll('.math-box').forEach(b => b.remove());
            const defs = arrowLayer.querySelector('defs').outerHTML; arrowLayer.innerHTML = defs;
            if(d.boxes) d.boxes.forEach(bx => createMathBox(bx.x, bx.y, bx.c));
            if(d.arrows) d.arrows.forEach(ar => { startDrawingArrow(0,0); activeLine.setAttribute('x1', ar.x1); activeLine.setAttribute('y1', ar.y1); activeLine.setAttribute('x2', ar.x2); activeLine.setAttribute('y2', ar.y2); });
            if (d.strokes) { allStrokes = d.strokes; dCtx.clearRect(0,0,2500,2500); allStrokes.forEach(s => { if(s.type==='scribble') { dCtx.beginPath(); dCtx.moveTo(s.points[0].x, s.points[0].y); s.points.forEach(p=>dCtx.lineTo(p.x, p.y)); dCtx.lineWidth = s.mode==='erase'?20:2; dCtx.globalCompositeOperation = s.mode==='erase'?'destination-out':'source-over'; dCtx.stroke(); } }); }
            showToast('Loaded!');
        } catch (err) { showToast('Error'); }
    };
    reader.readAsText(file);
}
