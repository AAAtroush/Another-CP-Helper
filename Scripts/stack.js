let stack = [];
let isAnimating = false;
let animationSpeed = 500;
let operationHistory = [];

const canvas = document.getElementById('stackCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawStack();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawStack(highlightedIndex = -1, operation = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (stack.length === 0) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(canvas.width / 2 - 80, canvas.height - 100, 160, 200);
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('المكدس فارغ', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const stackWidth = 160;
    const stackHeight = 60;
    const spacing = 10;
    const startX = canvas.width / 2 - stackWidth / 2;
    const startY = canvas.height - 100;
    
    ctx.fillStyle = '#475569';
    ctx.fillRect(startX - 10, startY + stack.length * (stackHeight + spacing), stackWidth + 20, 10);
    
    for (let i = 0; i < stack.length; i++) {
        const y = startY - i * (stackHeight + spacing);
        const isHighlighted = i === highlightedIndex;
        
        ctx.fillStyle = isHighlighted ? '#8b5cf6' : (i === stack.length - 1 ? '#6366f1' : '#3b82f6');
        ctx.fillRect(startX, y, stackWidth, stackHeight);
        
        ctx.strokeStyle = isHighlighted ? '#7c3aed' : '#1e40af';
        ctx.lineWidth = isHighlighted ? 4 : 2;
        ctx.strokeRect(startX, y, stackWidth, stackHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stack[i], startX + stackWidth / 2, y + stackHeight / 2);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.fillText(`[${i}]`, startX - 30, y + stackHeight / 2);
    }
    
    if (stack.length > 0) {
        const topY = startY - (stack.length - 1) * (stackHeight + spacing);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('TOP', startX + stackWidth + 20, topY + stackHeight / 2);
    }
    
    if (operation) {
        drawOperationAnimation(operation);
    }
}

function drawOperationAnimation(operation) {
    const { type, value, index } = operation;
    
    if (type === 'push') {
        const startY = -50;
        const endY = canvas.height - 100 - (stack.length - 1) * 70;
        const progress = operation.progress || 0;
        const currentY = startY + (endY - startY) * progress;
        
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(canvas.width / 2 - 80, currentY, 160, 60);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 4;
        ctx.strokeRect(canvas.width / 2 - 80, currentY, 160, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, canvas.width / 2, currentY + 30);
    } else if (type === 'pop') {
        const startY = canvas.height - 100 - (stack.length) * 70;
        const endY = -50;
        const progress = operation.progress || 0;
        const currentY = startY + (endY - startY) * progress;
        
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(canvas.width / 2 - 80, currentY, 160, 60);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.strokeRect(canvas.width / 2 - 80, currentY, 160, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, canvas.width / 2, currentY + 30);
    }
}

async function pushOperation() {
    if (isAnimating) return;
    
    const input = document.getElementById('pushValue');
    const value = input.value.trim();
    
    if (!value) {
        updateStatus('الرجاء إدخال قيمة');
        return;
    }
    
    isAnimating = true;
    animationSpeed = parseInt(document.getElementById('speed').value) || 500;
    
    // Animate push
    const operation = { type: 'push', value, progress: 0 };
    for (let i = 0; i <= 20; i++) {
        operation.progress = i / 20;
        drawStack(-1, operation);
        await sleep(animationSpeed / 20);
    }
    
    stack.push(value);
    operationHistory.push(`Push(${value})`);
    updateHistory();
    updateStatus(`تم إضافة ${value} إلى المكدس`);
    drawStack(stack.length - 1);
    updateStackInfo();
    
    input.value = '';
    isAnimating = false;
}

async function popOperation() {
    if (isAnimating) return;
    if (stack.length === 0) {
        updateStatus('المكدس فارغ! لا يمكن إجراء Pop');
        return;
    }
    
    isAnimating = true;
    animationSpeed = parseInt(document.getElementById('speed').value) || 500;
    
    const value = stack[stack.length - 1];
    
    // Highlight top element
    drawStack(stack.length - 1);
    await sleep(animationSpeed / 2);
    
    // Animate pop
    const operation = { type: 'pop', value, progress: 0 };
    for (let i = 0; i <= 20; i++) {
        operation.progress = i / 20;
        drawStack(-1, operation);
        await sleep(animationSpeed / 20);
    }
    
    stack.pop();
    operationHistory.push(`Pop() = ${value}`);
    updateHistory();
    updateStatus(`تم إزالة ${value} من المكدس`);
    drawStack();
    updateStackInfo();
    
    isAnimating = false;
}

function peekOperation() {
    if (stack.length === 0) {
        updateStatus('المكدس فارغ! لا يوجد عنصر للعرض');
        return;
    }
    
    const value = stack[stack.length - 1];
    drawStack(stack.length - 1);
    updateStatus(`العنصر العلوي: ${value}`);
    
    setTimeout(() => {
        drawStack();
    }, 1000);
}

function clearStack() {
    if (isAnimating) return;
    if (stack.length === 0) return;
    
    if (confirm('هل أنت متأكد من مسح المكدس بالكامل؟')) {
        stack = [];
        operationHistory = [];
        updateHistory();
        updateStatus('تم مسح المكدس');
        drawStack();
        updateStackInfo();
    }
}

function updateStackInfo() {
    document.getElementById('stackSize').textContent = stack.length;
    document.getElementById('isEmpty').textContent = stack.length === 0 ? 'نعم' : 'لا';
    document.getElementById('topElement').textContent = stack.length > 0 ? stack[stack.length - 1] : '-';
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

drawStack();
updateStackInfo();

