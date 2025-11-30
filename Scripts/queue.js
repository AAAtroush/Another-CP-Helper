let queue = [];
let isAnimating = false;
let animationSpeed = 500;
let operationHistory = [];

// Canvas setup
const canvas = document.getElementById('queueCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawQueue();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawQueue(highlightedIndex = -1, operation = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (queue.length === 0) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(canvas.width / 2 - 200, canvas.height / 2 - 50, 400, 100);
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('الطابور فارغ', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const queueWidth = 80;
    const queueHeight = 80;
    const spacing = 10;
    const startX = canvas.width / 2 - (queue.length * (queueWidth + spacing)) / 2;
    const startY = canvas.height / 2 - queueHeight / 2;
    
    for (let i = 0; i < queue.length; i++) {
        const x = startX + i * (queueWidth + spacing);
        const isHighlighted = i === highlightedIndex;
        
        ctx.fillStyle = isHighlighted ? '#8b5cf6' : (i === 0 ? '#6366f1' : '#3b82f6');
        ctx.fillRect(x, startY, queueWidth, queueHeight);
        
        ctx.strokeStyle = isHighlighted ? '#7c3aed' : '#1e40af';
        ctx.lineWidth = isHighlighted ? 4 : 2;
        ctx.strokeRect(x, startY, queueWidth, queueHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(queue[i], x + queueWidth / 2, startY + queueHeight / 2);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.fillText(`[${i}]`, x + queueWidth / 2, startY - 15);
    }
    
    if (queue.length > 0) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('FRONT', startX + queueWidth / 2, startY - 30);
    }
    
    if (queue.length > 0) {
        const rearX = startX + (queue.length - 1) * (queueWidth + spacing);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('REAR', rearX + queueWidth / 2, startY + queueHeight + 30);
    }
    
    if (operation) {
        drawOperationAnimation(operation);
    }
}

function drawOperationAnimation(operation) {
    const { type, value, index } = operation;
    
    if (type === 'enqueue') {
        const queueWidth = 80;
        const queueHeight = 80;
        const spacing = 10;
        const startX = canvas.width / 2 - (queue.length * (queueWidth + spacing)) / 2;
        const startY = canvas.height / 2 - queueHeight / 2;
        const endX = startX + (queue.length - 1) * (queueWidth + spacing);
        const fromX = canvas.width + 50;
        const progress = operation.progress || 0;
        const currentX = fromX + (endX - fromX) * progress;
        
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(currentX, startY, queueWidth, queueHeight);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 4;
        ctx.strokeRect(currentX, startY, queueWidth, queueHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, currentX + queueWidth / 2, startY + queueHeight / 2);
    } else if (type === 'dequeue') {
        const queueWidth = 80;
        const queueHeight = 80;
        const spacing = 10;
        const startX = canvas.width / 2 - ((queue.length + 1) * (queueWidth + spacing)) / 2;
        const startY = canvas.height / 2 - queueHeight / 2;
        const fromX = startX;
        const endX = -100;
        const progress = operation.progress || 0;
        const currentX = fromX + (endX - fromX) * progress;
        
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(currentX, startY, queueWidth, queueHeight);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.strokeRect(currentX, startY, queueWidth, queueHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, currentX + queueWidth / 2, startY + queueHeight / 2);
    }
}

async function enqueueOperation() {
    if (isAnimating) return;
    
    const input = document.getElementById('enqueueValue');
    const value = input.value.trim();
    
    if (!value) {
        updateStatus('الرجاء إدخال قيمة');
        return;
    }
    
    isAnimating = true;
    animationSpeed = parseInt(document.getElementById('speed').value) || 500;
    
    const operation = { type: 'enqueue', value, progress: 0 };
    for (let i = 0; i <= 20; i++) {
        operation.progress = i / 20;
        drawQueue(-1, operation);
        await sleep(animationSpeed / 20);
    }
    
    queue.push(value);
    operationHistory.push(`Enqueue(${value})`);
    updateHistory();
    updateStatus(`تم إضافة ${value} إلى الطابور`);
    drawQueue(queue.length - 1);
    updateQueueInfo();
    
    input.value = '';
    isAnimating = false;
}

async function dequeueOperation() {
    if (isAnimating) return;
    if (queue.length === 0) {
        updateStatus('الطابور فارغ! لا يمكن إجراء Dequeue');
        return;
    }
    
    isAnimating = true;
    animationSpeed = parseInt(document.getElementById('speed').value) || 500;
    
    const value = queue[0];
    
    drawQueue(0);
    await sleep(animationSpeed / 2);
    
    const operation = { type: 'dequeue', value, progress: 0 };
    for (let i = 0; i <= 20; i++) {
        operation.progress = i / 20;
        drawQueue(-1, operation);
        await sleep(animationSpeed / 20);
    }
    
    queue.shift();
    operationHistory.push(`Dequeue() = ${value}`);
    updateHistory();
    updateStatus(`تم إزالة ${value} من الطابور`);
    drawQueue();
    updateQueueInfo();
    
    isAnimating = false;
}

function frontOperation() {
    if (queue.length === 0) {
        updateStatus('الطابور فارغ! لا يوجد عنصر للعرض');
        return;
    }
    
    const value = queue[0];
    drawQueue(0);
    updateStatus(`العنصر الأمامي: ${value}`);
    
    setTimeout(() => {
        drawQueue();
    }, 1000);
}

function clearQueue() {
    if (isAnimating) return;
    if (queue.length === 0) return;
    
    if (confirm('هل أنت متأكد من مسح الطابور بالكامل؟')) {
        queue = [];
        operationHistory = [];
        updateHistory();
        updateStatus('تم مسح الطابور');
        drawQueue();
        updateQueueInfo();
    }
}

function updateQueueInfo() {
    document.getElementById('queueSize').textContent = queue.length;
    document.getElementById('isEmpty').textContent = queue.length === 0 ? 'نعم' : 'لا';
    document.getElementById('frontElement').textContent = queue.length > 0 ? queue[0] : '-';
}

function updateHistory() {
    const historyBox = document.getElementById('operationHistory');
    const historyItems = document.getElementById('historyItems');
    
    if (operationHistory.length === 0) {
        historyBox.style.display = 'none';
    } else {
        historyBox.style.display = 'block';
        historyItems.innerHTML = operationHistory.slice(-10).reverse().map(op => 
            `<div class="history-item">${op}</div>`
        ).join('');
    }
}

function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

drawQueue();
updateQueueInfo();

