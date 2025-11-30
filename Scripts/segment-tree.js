let array = [];
let segmentTree = [];
let n = 0;
let isRunning = false;
let animationSpeed = 500;

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawTree();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function parseArray(input) {
    return input.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
}

function initArray() {
    const input = document.getElementById('arrayInput').value.trim();
    if (input) {
        array = parseArray(input);
    } else {
        array = [1, 3, 5, 7, 9, 11];
        document.getElementById('arrayInput').value = array.join(' ');
    }
    n = array.length;
    updateStatus('تم تحميل المصفوفة');
}

initArray();

function buildSegmentTree(arr, start, end, treeIndex, highlight = {}) {
    if (start === end) {
        segmentTree[treeIndex] = arr[start];
        return arr[start];
    }
    
    const mid = Math.floor((start + end) / 2);
    const left = buildSegmentTree(arr, start, mid, 2 * treeIndex + 1, highlight);
    const right = buildSegmentTree(arr, mid + 1, end, 2 * treeIndex + 2, highlight);
    
    segmentTree[treeIndex] = left + right;
    return segmentTree[treeIndex];
}

async function buildTree() {
    if (isRunning) return;
    
    initArray();
    if (array.length === 0) {
        alert('الرجاء إدخال مصفوفة');
        return;
    }
    
    isRunning = true;
    document.getElementById('buildBtn').disabled = true;
    document.getElementById('queryBtn').disabled = true;
    document.getElementById('updateBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    n = array.length;
    const treeSize = 4 * n;
    segmentTree = new Array(treeSize).fill(0);
    
    updateStatus('جارٍ بناء Segment Tree...');
    drawTree({ building: true });
    await sleep(animationSpeed);
    
    buildSegmentTree(array, 0, n - 1, 0);
    
    updateStatus('تم بناء Segment Tree بنجاح');
    drawTree();
    updateTreeArray();
    
    isRunning = false;
    document.getElementById('buildBtn').disabled = false;
    document.getElementById('queryBtn').disabled = false;
    document.getElementById('updateBtn').disabled = false;
}

async function querySegmentTree(treeIndex, segStart, segEnd, queryStart, queryEnd, highlight = {}) {
    if (queryStart > segEnd || queryEnd < segStart) {
        return 0;
    }
    
    if (queryStart <= segStart && queryEnd >= segEnd) {
        drawTree({ querying: [queryStart, queryEnd], queryNode: treeIndex, queryRange: [segStart, segEnd] });
        await sleep(animationSpeed / 2);
        return segmentTree[treeIndex];
    }
    
    const mid = Math.floor((segStart + segEnd) / 2);
    drawTree({ querying: [queryStart, queryEnd], queryNode: treeIndex, queryRange: [segStart, segEnd] });
    await sleep(animationSpeed / 2);
    
    const left = await querySegmentTree(2 * treeIndex + 1, segStart, mid, queryStart, queryEnd, highlight);
    const right = await querySegmentTree(2 * treeIndex + 2, mid + 1, segEnd, queryStart, queryEnd, highlight);
    
    return left + right;
}

async function performQuery() {
    if (isRunning || segmentTree.length === 0) {
        if (segmentTree.length === 0) {
            alert('الرجاء بناء الشجرة أولاً');
        }
        return;
    }
    
    const from = parseInt(document.getElementById('queryFrom').value);
    const to = parseInt(document.getElementById('queryTo').value);
    
    if (isNaN(from) || isNaN(to) || from < 0 || to >= n || from > to) {
        alert('الرجاء إدخال نطاق صحيح!');
        return;
    }
    
    isRunning = true;
    document.getElementById('buildBtn').disabled = true;
    document.getElementById('queryBtn').disabled = true;
    document.getElementById('updateBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    updateStatus(`جارٍ استعلام المجموع من ${from} إلى ${to}...`);
    drawTree({ querying: [from, to] });
    await sleep(animationSpeed);
    
    const result = await querySegmentTree(0, 0, n - 1, from, to, { querying: [from, to] });
    
    updateStatus(`النتيجة: ${result}`);
    document.getElementById('resultDisplay').style.display = 'block';
    document.getElementById('resultValue').textContent = result;
    drawTree({ queryResult: [from, to, result] });
    
    await sleep(animationSpeed * 2);
    
    isRunning = false;
    document.getElementById('buildBtn').disabled = false;
    document.getElementById('queryBtn').disabled = false;
    document.getElementById('updateBtn').disabled = false;
    drawTree();
}

async function updateSegmentTree(treeIndex, segStart, segEnd, arrIndex, diff, highlight = {}) {
    if (arrIndex < segStart || arrIndex > segEnd) {
        return;
    }
    
    segmentTree[treeIndex] += diff;
    
    if (segStart !== segEnd) {
        const mid = Math.floor((segStart + segEnd) / 2);
        await updateSegmentTree(2 * treeIndex + 1, segStart, mid, arrIndex, diff, highlight);
        await updateSegmentTree(2 * treeIndex + 2, mid + 1, segEnd, arrIndex, diff, highlight);
    }
}

async function performUpdate() {
    if (isRunning || segmentTree.length === 0) {
        if (segmentTree.length === 0) {
            alert('الرجاء بناء الشجرة أولاً');
        }
        return;
    }
    
    const index = parseInt(document.getElementById('updateIndex').value);
    const value = parseInt(document.getElementById('updateValue').value);
    
    if (isNaN(index) || isNaN(value) || index < 0 || index >= n) {
        alert('الرجاء إدخال فهرس وقيمة صحيحة!');
        return;
    }
    
    isRunning = true;
    document.getElementById('buildBtn').disabled = true;
    document.getElementById('queryBtn').disabled = true;
    document.getElementById('updateBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    const diff = value - array[index];
    array[index] = value;
    
    updateStatus(`جارٍ تحديث العنصر في الفهرس ${index} إلى ${value}...`);
    drawTree({ updating: index });
    await sleep(animationSpeed);
    
    await updateSegmentTree(0, 0, n - 1, index, diff, { updating: index });
    
    updateStatus(`تم التحديث بنجاح`);
    drawTree({ updated: index });
    updateTreeArray();
    
    await sleep(animationSpeed * 2);
    
    isRunning = false;
    document.getElementById('buildBtn').disabled = false;
    document.getElementById('queryBtn').disabled = false;
    document.getElementById('updateBtn').disabled = false;
    drawTree();
}

function drawTree(highlight = {}) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (segmentTree.length === 0 || n === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('الرجاء بناء الشجرة أولاً', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const arrayY = canvas.height - 80;
    const cellWidth = Math.min(60, (canvas.width - 40) / n);
    const startX = (canvas.width - n * cellWidth) / 2;
    
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Cairo';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        ctx.fillText(`[${i}]`, x, arrayY - 25);
    }
    
    for (let i = 0; i < n; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        const y = arrayY;
        
        let bgColor = '#f1f5f9';
        let borderColor = '#cbd5e1';
        let textColor = '#1e293b';
        
        if (highlight.updating === i || highlight.updated === i) {
            bgColor = '#fef3c7';
            borderColor = '#f59e0b';
            textColor = '#92400e';
        } else if (highlight.querying && i >= highlight.querying[0] && i <= highlight.querying[1]) {
            bgColor = '#dbeafe';
            borderColor = '#3b82f6';
            textColor = '#1e40af';
        }
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - cellWidth / 2 + 5, y - 20, cellWidth - 10, 30);
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - cellWidth / 2 + 5, y - 20, cellWidth - 10, 30);
        
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px Cairo';
        ctx.fillText(array[i].toString(), x, y - 5);
    }
    
    const treeHeight = Math.ceil(Math.log2(n)) + 1;
    const nodeHeight = 50;
    const levelSpacing = 80;
    const treeStartY = 50;
    
    let nodeIndex = 0;
    for (let level = 0; level < treeHeight && nodeIndex < segmentTree.length; level++) {
        const nodesInLevel = Math.min(Math.pow(2, level), n);
        const levelY = treeStartY + level * levelSpacing;
        const levelWidth = nodesInLevel * cellWidth;
        const levelStartX = (canvas.width - levelWidth) / 2;
        
        for (let i = 0; i < nodesInLevel && nodeIndex < segmentTree.length; i++) {
            if (segmentTree[nodeIndex] === 0 && nodeIndex > 0) {
                nodeIndex++;
                continue;
            }
            
            const x = levelStartX + (i + 0.5) * (levelWidth / nodesInLevel);
            const y = levelY;
            
            let bgColor = '#e0e7ff';
            let borderColor = '#8b5cf6';
            let textColor = '#5b21b6';
            
            if (highlight.building) {
                bgColor = '#fef3c7';
                borderColor = '#f59e0b';
                textColor = '#92400e';
            }
            
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = textColor;
            ctx.font = 'bold 12px Cairo';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(segmentTree[nodeIndex].toString(), x, y);
            
            if (level > 0) {
                const parentIndex = Math.floor((nodeIndex - 1) / 2);
                const parentLevel = level - 1;
                const parentNodesInLevel = Math.min(Math.pow(2, parentLevel), n);
                const parentLevelWidth = parentNodesInLevel * cellWidth;
                const parentLevelStartX = (canvas.width - parentLevelWidth) / 2;
                const parentI = (nodeIndex - 1) % parentNodesInLevel;
                const parentX = parentLevelStartX + (parentI + 0.5) * (parentLevelWidth / parentNodesInLevel);
                const parentY = treeStartY + parentLevel * levelSpacing;
                
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(parentX, parentY + 20);
                ctx.lineTo(x, y - 20);
                ctx.stroke();
            }
            
            nodeIndex++;
        }
    }
}

function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}

function updateTreeArray() {
    const treeArrayItems = document.getElementById('treeArrayItems');
    const nonZeroTree = segmentTree.filter((val, idx) => val !== 0 || idx === 0);
    treeArrayItems.innerHTML = nonZeroTree.map((val, idx) => 
        `<span style="padding: 4px 8px; margin: 2px; background: #f1f5f9; border-radius: 4px;">[${idx}]=${val}</span>`
    ).join('');
    document.getElementById('treeArrayDisplay').style.display = 'block';
}

function resetTree() {
    if (isRunning) return;
    initArray();
    segmentTree = [];
    drawTree();
    document.getElementById('resultDisplay').style.display = 'none';
    document.getElementById('treeArrayDisplay').style.display = 'none';
    updateStatus('تم إعادة تعيين الشجرة');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

drawTree();

