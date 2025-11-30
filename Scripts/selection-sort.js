let array = [];
let isRunning = false;
let animationSpeed = 500;

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
        } else if (highlighted.min === i) {
            color = '#8b5cf6';
            borderColor = '#7c3aed';
        } else if (highlighted.comparing && highlighted.comparing === i) {
            color = '#ec4899';
            borderColor = '#db2777';
        } else if (highlighted.swapping && highlighted.swapping.includes(i)) {
            color = '#ef4444';
            borderColor = '#dc2626';
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, height);
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(array[i], x + barWidth / 2, y - 15);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.fillText(`[${i}]`, x + barWidth / 2, baseY + 20);
    }
}

async function startSelectionSort() {
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
    const n = array.length;
    const sorted = [];
    
    updateStatus('بدء عملية Selection Sort...');
    
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        
        drawArray({ current: i }, sorted);
        updateStatus(`البحث عن أصغر عنصر من الموضع ${i}...`);
        await sleep(animationSpeed);
        
        for (let j = i + 1; j < n; j++) {
            comparisons++;
            updateStats(comparisons, swaps);
            
            drawArray({ current: i, comparing: j, min: minIdx }, sorted);
            updateStatus(`مقارنة ${array[j]} مع ${array[minIdx]}...`);
            await sleep(animationSpeed);
            
            if (array[j] < array[minIdx]) {
                minIdx = j;
                drawArray({ current: i, min: minIdx }, sorted);
                updateStatus(`العنصر الأصغر الآن هو ${array[minIdx]} في الموضع ${minIdx}`);
                await sleep(animationSpeed);
            }
        }
        
        if (minIdx !== i) {
            drawArray({ current: i, min: minIdx, swapping: [i, minIdx] }, sorted);
            updateStatus(`تبديل ${array[i]} و ${array[minIdx]}...`);
            await sleep(animationSpeed);
            
            [array[i], array[minIdx]] = [array[minIdx], array[i]];
            swaps++;
            updateStats(comparisons, swaps);
            
            drawArray({ current: i, min: minIdx, swapping: [i, minIdx] }, sorted);
            await sleep(animationSpeed);
        }
        
        sorted.push(i);
        drawArray({}, sorted);
        updateStatus(`تم وضع العنصر في الموضع ${i} في مكانه الصحيح`);
        await sleep(animationSpeed);
    }
    
    sorted.push(n - 1);
    drawArray({}, sorted);
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

