let array = [];
let fenwickTree = [];
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

function buildFenwickTree() {
    fenwickTree = new Array(n + 1).fill(0);
    
    for (let i = 0; i < n; i++) {
        updateFenwickTree(i + 1, array[i]);
    }
}

function updateFenwickTree(index, value) {
    while (index <= n) {
        fenwickTree[index] += value;
        index += index & -index;
    }
}

function getPrefixSum(index) {
    let sum = 0;
    while (index > 0) {
        sum += fenwickTree[index];
        index -= index & -index;
    }
    return sum;
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
    document.getElementById('prefixBtn').disabled = true;
    document.getElementById('rangeBtn').disabled = true;
    document.getElementById('updateBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    n = array.length;
    fenwickTree = new Array(n + 1).fill(0);
    
    updateStatus('جارٍ بناء Fenwick Tree...');
    drawTree({ building: true });
    await sleep(animationSpeed);
    
    for (let i = 0; i < n; i++) {
        updateStatus(`جارٍ بناء العنصر ${i + 1}...`);
        drawTree({ buildingIndex: i + 1 });
        await sleep(animationSpeed / 2);
        
        let index = i + 1;
        while (index <= n) {
            fenwickTree[index] += array[i];
            drawTree({ updating: index, buildingIndex: i + 1 });
            await sleep(animationSpeed / 3);
            index += index & -index;
        }
    }
    
    updateStatus('تم بناء Fenwick Tree بنجاح');
    drawTree();
    updateTreeArray();
    
    isRunning = false;
    document.getElementById('buildBtn').disabled = false;
    document.getElementById('prefixBtn').disabled = false;
    document.getElementById('rangeBtn').disabled = false;
    document.getElementById('updateBtn').disabled = false;
}

async function performPrefixSum() {
    if (isRunning || fenwickTree.length === 0) {
        if (fenwickTree.length === 0) {
            alert('الرجاء بناء الشجرة أولاً');
        }
        return;
    }
    
    const index = parseInt(document.getElementById('prefixIndex').value);
    
    if (isNaN(index) || index < 0 || index > n) {
        alert('الرجاء إدخال فهرس صحيح!');
        return;
    }
    
    isRunning = true;
    document.getElementById('buildBtn').disabled = true;
    document.getElementById('prefixBtn').disabled = true;
    document.getElementById('rangeBtn').disabled = true;
    document.getElementById('updateBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    updateStatus(`جارٍ حساب Prefix Sum حتى الفهرس ${index}...`);
    drawTree({ querying: index, queryType: 'prefix' });
    await sleep(animationSpeed);
    
    let sum = 0;
    let currentIndex = index;
    const path = [];
    
    while (currentIndex > 0) {
        path.push(currentIndex);
        drawTree({ querying: index, queryPath: [...path], queryType: 'prefix' });
        await sleep(animationSpeed);
        sum += fenwickTree[currentIndex];
        currentIndex -= currentIndex & -index;
    }
    
    updateStatus(`Prefix Sum حتى الفهرس ${index} = ${sum}`);
    document.getElementById('resultDisplay').style.display = 'block';
    document.getElementById('resultValue').textContent = sum;
    drawTree({ queryResult: [index, sum], queryType: 'prefix' });
    
    await sleep(animationSpeed * 2);
    
    isRunning = false;
    document.getElementById('buildBtn').disabled = false;
    document.getElementById('prefixBtn').disabled = false;
    document.getElementById('rangeBtn').disabled = false;
    document.getElementById('updateBtn').disabled = false;
    drawTree();
}

async function performRangeSum() {
    if (isRunning || fenwickTree.length === 0) {
        if (fenwickTree.length === 0) {
            alert('الرجاء بناء الشجرة أولاً');
        }
        return;
    }
    
    const from = parseInt(document.getElementById('rangeFrom').value);
    const to = parseInt(document.getElementById('rangeTo').value);
    
    if (isNaN(from) || isNaN(to) || from < 1 || to > n || from > to) {
        alert('الرجاء إدخال نطاق صحيح!');
        return;
    }
    
    isRunning = true;
    document.getElementById('buildBtn').disabled = true;
    document.getElementById('prefixBtn').disabled = true;
    document.getElementById('rangeBtn').disabled = true;
    document.getElementById('updateBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    updateStatus(`جارٍ حساب Range Sum من ${from} إلى ${to}...`);
    drawTree({ querying: [from, to], queryType: 'range' });
    await sleep(animationSpeed);
    
    let sumTo = 0;
    let currentIndex = to;
    const pathTo = [];
    while (currentIndex > 0) {
        pathTo.push(currentIndex);
        drawTree({ querying: [from, to], queryPath: [...pathTo], queryType: 'range', calculating: 'to' });
        await sleep(animationSpeed / 2);
        sumTo += fenwickTree[currentIndex];
        currentIndex -= currentIndex & -currentIndex;
    }
    
    let sumFrom = 0;
    if (from > 1) {
        currentIndex = from - 1;
        const pathFrom = [];
        while (currentIndex > 0) {
            pathFrom.push(currentIndex);
            drawTree({ querying: [from, to], queryPath: [...pathTo, ...pathFrom], queryType: 'range', calculating: 'from' });
            await sleep(animationSpeed / 2);
            sumFrom += fenwickTree[currentIndex];
            currentIndex -= currentIndex & -currentIndex;
        }
    }
    
    const result = sumTo - sumFrom;
    
    updateStatus(`Range Sum من ${from} إلى ${to} = ${result}`);
    document.getElementById('resultDisplay').style.display = 'block';
    document.getElementById('resultValue').textContent = result;
    drawTree({ queryResult: [from, to, result], queryType: 'range' });
    
    await sleep(animationSpeed * 2);
    
    isRunning = false;
    document.getElementById('buildBtn').disabled = false;
    document.getElementById('prefixBtn').disabled = false;
    document.getElementById('rangeBtn').disabled = false;
    document.getElementById('updateBtn').disabled = false;
    drawTree();
}

async function performUpdate() {
    if (isRunning || fenwickTree.length === 0) {
        if (fenwickTree.length === 0) {
            alert('الرجاء بناء الشجرة أولاً');
        }
        return;
    }
    
    const index = parseInt(document.getElementById('updateIndex').value);
    const value = parseInt(document.getElementById('updateValue').value);
    
    if (isNaN(index) || isNaN(value) || index < 1 || index > n) {
        alert('الرجاء إدخال فهرس وقيمة صحيحة!');
        return;
    }
    
    isRunning = true;
    document.getElementById('buildBtn').disabled = true;
    document.getElementById('prefixBtn').disabled = true;
    document.getElementById('rangeBtn').disabled = true;
    document.getElementById('updateBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    const diff = value - array[index - 1];
    array[index - 1] = value;
    
    updateStatus(`جارٍ تحديث العنصر في الفهرس ${index} إلى ${value}...`);
    drawTree({ updating: index });
    await sleep(animationSpeed);
    
    let currentIndex = index;
    const path = [];
    
    while (currentIndex <= n) {
        path.push(currentIndex);
        drawTree({ updating: index, updatePath: [...path] });
        await sleep(animationSpeed / 2);
        fenwickTree[currentIndex] += diff;
        currentIndex += currentIndex & -currentIndex;
    }
    
    updateStatus(`تم التحديث بنجاح`);
    drawTree({ updated: index });
    updateTreeArray();
    
    await sleep(animationSpeed * 2);
    
    isRunning = false;
    document.getElementById('buildBtn').disabled = false;
    document.getElementById('prefixBtn').disabled = false;
    document.getElementById('rangeBtn').disabled = false;
    document.getElementById('updateBtn').disabled = false;
    drawTree();
}

function drawTree(highlight = {}) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (fenwickTree.length === 0 || n === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('الرجاء بناء الشجرة أولاً', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Draw original array at bottom
    const arrayY = canvas.height - 100;
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
        
        if (highlight.updating === i + 1 || highlight.updated === i + 1) {
            bgColor = '#fef3c7';
            borderColor = '#f59e0b';
            textColor = '#92400e';
        } else if (highlight.querying && typeof highlight.querying === 'number' && i < highlight.querying) {
            bgColor = '#dbeafe';
            borderColor = '#3b82f6';
            textColor = '#1e40af';
        } else if (highlight.querying && Array.isArray(highlight.querying) && i >= highlight.querying[0] - 1 && i < highlight.querying[1]) {
            bgColor = '#dbeafe';
            borderColor = '#3b82f6';
            textColor = '#1e40af';
        } else if (highlight.calculating === 'to' && highlight.queryPath && highlight.queryPath.includes(i + 1)) {
            bgColor = '#dbeafe';
            borderColor = '#3b82f6';
            textColor = '#1e40af';
        } else if (highlight.calculating === 'from' && highlight.queryPath && highlight.queryPath.includes(i + 1)) {
            bgColor = '#fef3c7';
            borderColor = '#f59e0b';
            textColor = '#92400e';
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
    
    // Draw Fenwick Tree array (1-indexed)
    const treeY = arrayY - 60;
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Cairo';
    for (let i = 1; i <= n; i++) {
        const x = startX + (i - 1) * cellWidth + cellWidth / 2;
        ctx.fillText(`[${i}]`, x, treeY - 25);
    }
    
    for (let i = 1; i <= n; i++) {
        const x = startX + (i - 1) * cellWidth + cellWidth / 2;
        const y = treeY;
        
        let bgColor = '#e0e7ff';
        let borderColor = '#8b5cf6';
        let textColor = '#5b21b6';
        
        if (highlight.buildingIndex === i) {
            bgColor = '#fef3c7';
            borderColor = '#f59e0b';
            textColor = '#92400e';
        } else if (highlight.updating === i || highlight.updated === i) {
            bgColor = '#fef3c7';
            borderColor = '#f59e0b';
            textColor = '#92400e';
        } else if (highlight.updatePath && highlight.updatePath.includes(i)) {
            bgColor = '#dcfce7';
            borderColor = '#10b981';
            textColor = '#065f46';
        } else if (highlight.queryPath && highlight.queryPath.includes(i)) {
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
        ctx.fillText(fenwickTree[i].toString(), x, y - 5);
        
        // Draw connections showing which indices are updated
        if (i > 1) {
            const parent = i - (i & -i);
            if (parent > 0) {
                const parentX = startX + (parent - 1) * cellWidth + cellWidth / 2;
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(parentX, y - 20);
                ctx.lineTo(x, y - 20);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
}

function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}

function updateTreeArray() {
    const treeArrayItems = document.getElementById('treeArrayItems');
    treeArrayItems.innerHTML = fenwickTree.slice(1).map((val, idx) => 
        `<span style="padding: 4px 8px; margin: 2px; background: #f1f5f9; border-radius: 4px;">[${idx + 1}]=${val}</span>`
    ).join('');
    document.getElementById('treeArrayDisplay').style.display = 'block';
}

function resetTree() {
    if (isRunning) return;
    initArray();
    fenwickTree = [];
    drawTree();
    document.getElementById('resultDisplay').style.display = 'none';
    document.getElementById('treeArrayDisplay').style.display = 'none';
    updateStatus('تم إعادة تعيين الشجرة');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

drawTree();

