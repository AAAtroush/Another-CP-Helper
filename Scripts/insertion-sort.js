let array = [];
let isRunning = false;
let animationSpeed = 500;

// Canvas setup
const canvas = document.getElementById('sortCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawArray();
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
        array = [64, 34, 25, 12, 22, 11, 90];
        document.getElementById('arrayInput').value = array.join(' ');
    }
    drawArray();
    updateStatus('تم تحميل المصفوفة');
    updateStats(0, 0);
}

initArray();

function drawArray(highlighted = {}, sorted = []) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (array.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('المصفوفة فارغة', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const barWidth = Math.min(60, (canvas.width - 40) / array.length);
    const spacing = 10;
    const maxValue = Math.max(...array, 1);
    const startX = (canvas.width - (array.length * (barWidth + spacing) - spacing)) / 2;
    const baseY = canvas.height - 50;
    const maxHeight = canvas.height - 150;
    
    for (let i = 0; i < array.length; i++) {
        const x = startX + i * (barWidth + spacing);
        const height = (array[i] / maxValue) * maxHeight;
        const y = baseY - height;
        
        let color = '#3b82f6';
        let borderColor = '#1e40af';
        
        if (sorted.includes(i)) {
            color = '#10b981';
            borderColor = '#059669';
        } else if (highlighted.current === i) {
            color = '#f59e0b';
            borderColor = '#d97706';
        } else if (highlighted.comparing && highlighted.comparing === i) {
            color = '#8b5cf6';
            borderColor = '#7c3aed';
        } else if (highlighted.shifting && highlighted.shifting.includes(i)) {
            color = '#ef4444';
            borderColor = '#dc2626';
        }
        
        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, height);
        
        // Draw border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, height);
        
        // Draw value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(array[i], x + barWidth / 2, y - 15);
        
        // Draw index
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.fillText(`[${i}]`, x + barWidth / 2, baseY + 20);
    }
}

async function startInsertionSort() {
    if (isRunning) return;
    
    initArray();
    if (array.length === 0) {
        alert('الرجاء إدخال مصفوفة');
        return;
    }
    
    isRunning = true;
    document.getElementById('startBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    let comparisons = 0;
    let swaps = 0;
    const sorted = [0];
    
    updateStatus('بدء عملية Insertion Sort...');
    drawArray({}, sorted);
    await sleep(animationSpeed);
    
    for (let i = 1; i < array.length; i++) {
        const key = array[i];
        let j = i - 1;
        
        drawArray({ current: i }, sorted);
        updateStatus(`جارٍ إدراج العنصر ${key} في الموضع الصحيح...`);
        await sleep(animationSpeed);
        
        while (j >= 0 && array[j] > key) {
            comparisons++;
            updateStats(comparisons, swaps);
            
            drawArray({ current: i, comparing: j }, sorted);
            updateStatus(`مقارنة ${array[j]} و ${key}...`);
            await sleep(animationSpeed);
            
            drawArray({ current: i, shifting: [j, j + 1] }, sorted);
            updateStatus(`نقل ${array[j]} إلى اليمين...`);
            await sleep(animationSpeed);
            
            array[j + 1] = array[j];
            swaps++;
            updateStats(comparisons, swaps);
            
            drawArray({ current: i, shifting: [j, j + 1] }, sorted);
            await sleep(animationSpeed);
            
            j--;
        }
        
        array[j + 1] = key;
        sorted.push(i);
        
        drawArray({}, sorted);
        updateStatus(`تم إدراج ${key} في الموضع ${j + 1}`);
        await sleep(animationSpeed);
    }
    
    const allSorted = array.map((_, idx) => idx);
    drawArray({}, allSorted);
    updateStatus(`اكتمل الفرز! عدد المقارنات: ${comparisons}, عدد التبديلات: ${swaps}`);
    updateStats(comparisons, swaps);
    
    isRunning = false;
    document.getElementById('startBtn').disabled = false;
}

function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

function updateStats(comparisons, swaps) {
    document.getElementById('comparisonsDisplay').style.display = 'block';
    document.getElementById('swapsDisplay').style.display = 'block';
    document.getElementById('comparisonsCount').textContent = comparisons;
    document.getElementById('swapsCount').textContent = swaps;
}

function resetArray() {
    if (isRunning) return;
    initArray();
    updateStatus('تم إعادة تعيين المصفوفة');
    updateStats(0, 0);
}

function generateRandom() {
    if (isRunning) return;
    const n = Math.floor(Math.random() * 10) + 5;
    array = [];
    for (let i = 0; i < n; i++) {
        array.push(Math.floor(Math.random() * 100) + 1);
    }
    document.getElementById('arrayInput').value = array.join(' ');
    drawArray();
    updateStatus('تم توليد أرقام عشوائية');
    updateStats(0, 0);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

drawArray();

