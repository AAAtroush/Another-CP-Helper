let elements = [];
let isRunning = false;
let animationSpeed = 500;
let allSubsets = [];

// Canvas setup
const canvas = document.getElementById('bitmaskCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawBitmask();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function parseElements(input) {
    return input.trim().split(/[\s,]+/).filter(e => e.length > 0);
}

function initElements() {
    const input = document.getElementById('elementsInput').value.trim();
    if (input) {
        elements = parseElements(input);
    } else {
        elements = ['A', 'B', 'C'];
        document.getElementById('elementsInput').value = elements.join(' ');
    }
    allSubsets = [];
    updateStatus('تم تحميل العناصر');
}

initElements();

function getBinaryString(num, bits) {
    return num.toString(2).padStart(bits, '0');
}

function getSubsetFromMask(mask) {
    const subset = [];
    for (let i = 0; i < elements.length; i++) {
        if (mask & (1 << i)) {
            subset.push(elements[i]);
        }
    }
    return subset;
}

async function startBitmask() {
    if (isRunning) return;
    
    initElements();
    if (elements.length === 0) {
        alert('الرجاء إدخال عناصر');
        return;
    }
    
    if (elements.length > 10) {
        alert('الرجاء إدخال 10 عناصر أو أقل للتصور الأمثل');
        return;
    }
    
    isRunning = true;
    document.getElementById('startBtn').disabled = true;
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    const n = elements.length;
    const totalSubsets = Math.pow(2, n);
    allSubsets = [];
    
    updateStatus(`جارٍ توليد جميع المجموعات (${totalSubsets} مجموعة)...`);
    document.getElementById('currentMaskDisplay').style.display = 'block';
    document.getElementById('currentSetDisplay').style.display = 'block';
    document.getElementById('allSetsDisplay').style.display = 'block';
    
    for (let mask = 0; mask < totalSubsets; mask++) {
        const binary = getBinaryString(mask, n);
        const subset = getSubsetFromMask(mask);
        allSubsets.push(subset);
        
        // Update displays
        document.getElementById('currentMaskValue').textContent = `${mask} (${binary})`;
        const currentSetItems = document.getElementById('currentSetItems');
        if (subset.length === 0) {
            currentSetItems.innerHTML = '<span style="color: #94a3b8;">{ } (مجموعة فارغة)</span>';
        } else {
            currentSetItems.innerHTML = `{ ${subset.join(', ')} }`;
        }
        
        const allSetsItems = document.getElementById('allSetsItems');
        allSetsItems.innerHTML = allSubsets.map((set, idx) => {
            const maskStr = getBinaryString(idx, n);
            return `<div style="padding: 4px 8px; margin: 2px; background: ${idx === mask ? '#dbeafe' : '#f1f5f9'}; border-radius: 4px; border: ${idx === mask ? '2px solid #3b82f6' : '1px solid #cbd5e1'};">
                ${idx}: ${maskStr} → { ${set.length === 0 ? '∅' : set.join(', ')} }
            </div>`;
        }).join('');
        
        allSetsItems.scrollTop = allSetsItems.scrollHeight;
        
        drawBitmask({ currentMask: mask, currentSubset: subset });
        updateStatus(`المجموعة ${mask + 1}/${totalSubsets}: { ${subset.length === 0 ? '∅' : subset.join(', ')} }`);
        
        await sleep(animationSpeed);
    }
    
    updateStatus(`اكتمل التوليد! تم إنشاء ${totalSubsets} مجموعة`);
    drawBitmask({ completed: true });
    
    isRunning = false;
    document.getElementById('startBtn').disabled = false;
}

function drawBitmask(highlight = {}) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (elements.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('الرجاء إدخال عناصر', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const n = elements.length;
    const cellWidth = Math.min(80, (canvas.width - 40) / (n + 1));
    const cellHeight = 50;
    const startX = (canvas.width - (n + 1) * cellWidth) / 2;
    const startY = canvas.height / 2 - cellHeight;
    
    // Draw mask number
    if (highlight.currentMask !== undefined) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Mask: ${highlight.currentMask}`, canvas.width / 2, startY - 40);
    }
    
    // Draw binary representation
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Cairo';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        ctx.fillText(`Bit ${i}`, x, startY - 20);
    }
    
    // Draw binary bits
    if (highlight.currentMask !== undefined) {
        const binary = getBinaryString(highlight.currentMask, n);
        for (let i = 0; i < n; i++) {
            const x = startX + i * cellWidth + cellWidth / 2;
            const y = startY;
            
            const bit = binary[n - 1 - i]; // Reverse for display
            const isSet = bit === '1';
            
            let bgColor = isSet ? '#dcfce7' : '#f1f5f9';
            let borderColor = isSet ? '#10b981' : '#cbd5e1';
            let textColor = isSet ? '#065f46' : '#64748b';
            
            if (highlight.completed) {
                bgColor = '#e0e7ff';
                borderColor = '#8b5cf6';
                textColor = '#5b21b6';
            }
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(x - cellWidth / 2 + 5, y - cellHeight / 2 + 5, cellWidth - 10, cellHeight - 10);
            
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - cellWidth / 2 + 5, y - cellHeight / 2 + 5, cellWidth - 10, cellHeight - 10);
            
            ctx.fillStyle = textColor;
            ctx.font = 'bold 18px Cairo';
            ctx.fillText(bit, x, y);
        }
    }
    
    const elementsY = startY + cellHeight + 30;
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Cairo';
    for (let i = 0; i < n; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        ctx.fillText(`[${i}]`, x, elementsY - 20);
    }
    
    for (let i = 0; i < n; i++) {
        const x = startX + i * cellWidth + cellWidth / 2;
        const y = elementsY;
        
        const isIncluded = highlight.currentSubset && highlight.currentSubset.includes(elements[i]);
        
        let bgColor = isIncluded ? '#dbeafe' : '#f1f5f9';
        let borderColor = isIncluded ? '#3b82f6' : '#cbd5e1';
        let textColor = isIncluded ? '#1e40af' : '#64748b';
        
        if (highlight.completed) {
            bgColor = '#e0e7ff';
            borderColor = '#8b5cf6';
            textColor = '#5b21b6';
        }
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - cellWidth / 2 + 5, y - cellHeight / 2 + 5, cellWidth - 10, cellHeight - 10);
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - cellWidth / 2 + 5, y - cellHeight / 2 + 5, cellWidth - 10, cellHeight - 10);
        
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Cairo';
        ctx.fillText(elements[i], x, y);
        
        if (highlight.currentMask !== undefined && highlight.currentSubset && isIncluded) {
            const binary = getBinaryString(highlight.currentMask, n);
            const bit = binary[n - 1 - i];
            if (bit === '1') {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(x, startY + cellHeight / 2 - 5);
                ctx.lineTo(x, y - cellHeight / 2 + 5);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
    
    // Draw subset result
    if (highlight.currentSubset !== undefined) {
        const resultY = elementsY + cellHeight + 30;
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Cairo';
        ctx.textAlign = 'center';
        const subsetStr = highlight.currentSubset.length === 0 ? '∅' : `{ ${highlight.currentSubset.join(', ')} }`;
        ctx.fillText(`المجموعة: ${subsetStr}`, canvas.width / 2, resultY);
    }
}

function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}

function resetBitmask() {
    if (isRunning) return;
    initElements();
    allSubsets = [];
    drawBitmask();
    document.getElementById('currentMaskDisplay').style.display = 'none';
    document.getElementById('currentSetDisplay').style.display = 'none';
    document.getElementById('allSetsDisplay').style.display = 'none';
    updateStatus('تم إعادة تعيين');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

drawBitmask();

