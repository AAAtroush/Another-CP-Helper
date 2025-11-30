// DSU Data Structure
let parent = [];
let rank = [];
let numElements = 8;
let isRunning = false;
let animationSpeed = 500;

// Canvas setup
const canvas = document.getElementById('dsuCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawDSU();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function initDSU(n) {
    parent = [];
    rank = [];
    for (let i = 0; i < n; i++) {
        parent[i] = i;
        rank[i] = 0;
    }
    drawDSU();
    updateStatus(`تم تهيئة DSU مع ${n} عناصر`);
    updateDisplays();
}

function find(x, highlight = false) {
    if (parent[x] !== x) {
        if (highlight) {
            drawDSU({ finding: x, path: [x] });
        }
        parent[x] = find(parent[x], highlight);
        if (highlight) {
            drawDSU({ finding: x, path: [x, parent[x]] });
        }
    }
    return parent[x];
}

async function performFind() {
    if (isRunning) return;
    
    const element = parseInt(document.getElementById('findElement').value);
    if (isNaN(element) || element < 0 || element >= numElements) {
        alert('الرجاء إدخال عنصر صحيح!');
        return;
    }
    
    isRunning = true;
    document.getElementById('findBtn').disabled = true;
    document.getElementById('unionBtn').disabled = true;
    
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    updateStatus(`جارٍ البحث عن الجذر للعنصر ${element}...`);
    
    const originalParent = [...parent];
    const root = find(element, true);
    
    await sleep(animationSpeed);
    
    updateStatus(`الجذر للعنصر ${element} هو ${root}`);
    drawDSU({ found: element, root: root });
    updateDisplays();
    
    await sleep(animationSpeed);
    
    isRunning = false;
    document.getElementById('findBtn').disabled = false;
    document.getElementById('unionBtn').disabled = false;
    drawDSU();
}

async function performUnion() {
    if (isRunning) return;
    
    const from = parseInt(document.getElementById('unionFrom').value);
    const to = parseInt(document.getElementById('unionTo').value);
    
    if (isNaN(from) || isNaN(to) || from < 0 || to < 0 || from >= numElements || to >= numElements) {
        alert('الرجاء إدخال عناصر صحيحة!');
        return;
    }
    
    if (from === to) {
        alert('لا يمكن عمل Union لنفس العنصر!');
        return;
    }
    
    isRunning = true;
    document.getElementById('findBtn').disabled = true;
    document.getElementById('unionBtn').disabled = true;
    
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    updateStatus(`جارٍ عمل Union بين ${from} و ${to}...`);
    
    const rootX = find(from, true);
    await sleep(animationSpeed);
    
    const rootY = find(to, true);
    await sleep(animationSpeed);
    
    if (rootX === rootY) {
        updateStatus(`العنصران ${from} و ${to} في نفس المجموعة (الجذر: ${rootX})`);
        drawDSU({ unioning: [from, to], sameRoot: true });
        await sleep(animationSpeed);
    } else {
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
            drawDSU({ unioning: [from, to], newParent: [rootX, rootY] });
            updateStatus(`تم ربط ${rootX} بـ ${rootY} (Rank ${rootX} < Rank ${rootY})`);
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
            drawDSU({ unioning: [from, to], newParent: [rootY, rootX] });
            updateStatus(`تم ربط ${rootY} بـ ${rootX} (Rank ${rootY} < Rank ${rootX})`);
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
            drawDSU({ unioning: [from, to], newParent: [rootY, rootX], rankIncrease: rootX });
            updateStatus(`تم ربط ${rootY} بـ ${rootX} وزيادة Rank (Rank متساوي)`);
        }
        await sleep(animationSpeed);
    }
    
    updateDisplays();
    
    isRunning = false;
    document.getElementById('findBtn').disabled = false;
    document.getElementById('unionBtn').disabled = false;
    drawDSU();
}

function resetDSU() {
    if (isRunning) return;
    numElements = parseInt(document.getElementById('numElements').value) || 8;
    if (numElements < 2) numElements = 2;
    if (numElements > 20) numElements = 20;
    document.getElementById('numElements').value = numElements;
    initDSU(numElements);
}

function clearDSU() {
    if (isRunning) return;
    initDSU(8);
    document.getElementById('numElements').value = 8;
    document.getElementById('unionFrom').value = '';
    document.getElementById('unionTo').value = '';
    document.getElementById('findElement').value = '';
}

function drawDSU(highlight = {}) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cellWidth = Math.min(80, canvas.width / (numElements + 2));
    const cellHeight = 60;
    const startX = (canvas.width - numElements * cellWidth) / 2;
    const startY = canvas.height / 2 - cellHeight;
    
    // Draw indices
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Cairo';
    ctx.textAlign = 'center';
    for (let i = 0; i < numElements; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        const y = startY - 20;
        ctx.fillText(`[${i}]`, x, y);
    }
    
    // Draw parent array
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px Cairo';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < numElements; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        const y = startY + cellHeight / 2;
        
        let bgColor = '#f1f5f9';
        let borderColor = '#cbd5e1';
        let textColor = '#1e293b';
        
        if (highlight.finding === i || highlight.found === i) {
            bgColor = '#dbeafe';
            borderColor = '#3b82f6';
            textColor = '#1e40af';
        } else if (highlight.unioning && highlight.unioning.includes(i)) {
            bgColor = '#fef3c7';
            borderColor = '#f59e0b';
            textColor = '#92400e';
        } else if (highlight.newParent && highlight.newParent[0] === i) {
            bgColor = '#dcfce7';
            borderColor = '#10b981';
            textColor = '#065f46';
        } else if (highlight.root === i) {
            bgColor = '#e0e7ff';
            borderColor = '#8b5cf6';
            textColor = '#5b21b6';
        }
        
        // Draw cell
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - cellWidth / 2 + 5, y - cellHeight / 2 + 5, cellWidth - 10, cellHeight - 10);
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - cellWidth / 2 + 5, y - cellHeight / 2 + 5, cellWidth - 10, cellHeight - 10);
        
        // Draw parent value
        ctx.fillStyle = textColor;
        ctx.fillText(parent[i].toString(), x, y);
        
        // Draw arrow to parent if not self
        if (parent[i] !== i) {
            const parentX = startX + parent[i] * cellWidth + cellWidth / 2;
            const parentY = startY + cellHeight / 2;
            
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + cellHeight / 2 - 5);
            ctx.lineTo(x, y + 30);
            ctx.lineTo(parentX, y + 30);
            ctx.lineTo(parentX, parentY - cellHeight / 2 + 5);
            ctx.stroke();
            
            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(parentX, parentY - cellHeight / 2 + 5);
            ctx.lineTo(parentX - 5, parentY - cellHeight / 2 + 10);
            ctx.lineTo(parentX + 5, parentY - cellHeight / 2 + 10);
            ctx.closePath();
            ctx.fillStyle = '#94a3b8';
            ctx.fill();
        }
    }
    
    // Draw rank array below
    const rankY = startY + cellHeight + 40;
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Cairo';
    for (let i = 0; i < numElements; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        const y = rankY - 20;
        ctx.fillText(`Rank[${i}]`, x, y);
    }
    
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px Cairo';
    for (let i = 0; i < numElements; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        const y = rankY + cellHeight / 2;
        
        let bgColor = '#f1f5f9';
        let borderColor = '#cbd5e1';
        let textColor = '#1e293b';
        
        if (highlight.rankIncrease === i) {
            bgColor = '#dcfce7';
            borderColor = '#10b981';
            textColor = '#065f46';
        }
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - cellWidth / 2 + 5, y - cellHeight / 2 + 5, cellWidth - 10, cellHeight - 10);
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - cellWidth / 2 + 5, y - cellHeight / 2 + 5, cellWidth - 10, cellHeight - 10);
        
        ctx.fillStyle = textColor;
        ctx.fillText(rank[i].toString(), x, y);
    }
}

function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}

function updateDisplays() {
    const parentItems = document.getElementById('parentItems');
    const rankItems = document.getElementById('rankItems');
    
    parentItems.innerHTML = parent.map((p, i) => 
        `<span style="padding: 4px 8px; margin: 2px; background: #f1f5f9; border-radius: 4px;">[${i}]=${p}</span>`
    ).join('');
    
    rankItems.innerHTML = rank.map((r, i) => 
        `<span style="padding: 4px 8px; margin: 2px; background: #f1f5f9; border-radius: 4px;">[${i}]=${r}</span>`
    ).join('');
    
    document.getElementById('parentDisplay').style.display = 'block';
    document.getElementById('rankDisplay').style.display = 'block';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize
initDSU(8);

