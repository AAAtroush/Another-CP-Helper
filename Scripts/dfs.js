// Graph data structure
let nodes = [];
let edges = [];
let nodePositions = {};
let mode = 'normal';
let isRunning = false;
let animationSpeed = 500;

// Interaction state
let selectedNode = null;
let isDragging = false;
let dragNode = null;
let didDrag = false;

// Canvas setup
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawGraph();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize with default graph
function initDefaultGraph() {
    nodes = ['A', 'B', 'C', 'D', 'E', 'F'];
    edges = [
        ['A', 'B'], ['A', 'C'],
        ['B', 'D'], ['B', 'E'],
        ['C', 'F'],
        ['D', 'E']
    ];
    
    // Calculate positions in a tree-like structure
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    nodePositions = {
        'A': { x: centerX, y: 100 },
        'B': { x: centerX - 150, y: 250 },
        'C': { x: centerX + 150, y: 250 },
        'D': { x: centerX - 200, y: 400 },
        'E': { x: centerX - 100, y: 400 },
        'F': { x: centerX + 150, y: 400 }
    };
    
    drawGraph();
}

initDefaultGraph();

// Set interaction mode
function setMode(newMode, button) {
    if (isRunning) return;
    
    mode = newMode;
    
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.style.opacity = '1';
    });
    if (button) button.style.opacity = '0.7';
    
    if (mode === 'addNode') {
        canvas.style.cursor = 'crosshair';
        canvas.classList.add('crosshair-cursor');
        updateStatus('انقر لإضافة عقدة جديدة');
    } else if (mode === 'addEdge') {
        canvas.style.cursor = 'crosshair';
        canvas.classList.add('crosshair-cursor');
        updateStatus('انقر لاختيار العقدة الأولى لإضافة حافة');
    } else {
        canvas.style.cursor = 'default';
        canvas.classList.remove('crosshair-cursor');
        updateStatus('الوضع العادي');
    }
}

// Canvas click handler
canvas.addEventListener('click', (e) => {
    if (isRunning) return;
    if (didDrag) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // -------------------
    // ADD NODE MODE
    // -------------------
    if (mode === 'addNode') {
        const nodeName = prompt(
            'أدخل اسم العقدة:',
            String.fromCharCode(65 + nodes.length)
        );
        
        if (nodeName && nodeName.trim()) {
            const name = nodeName.trim().toUpperCase();
            
            if (!nodes.includes(name)) {
                nodes.push(name);
                nodePositions[name] = { x, y };
                drawGraph();
                updateStatus(`تمت إضافة العقدة ${name}`);
            } else {
                alert('العقدة موجودة بالفعل!');
            }
        }
        
        // Return to normal mode after adding one node
        mode = 'normal';
        canvas.style.cursor = 'default';
        canvas.classList.remove('crosshair-cursor');
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.style.opacity = '1';
        });
        
        return;
    }
    
    // -------------------
    // ADD EDGE MODE
    // -------------------
    if (mode === 'addEdge') {
        const clickedNode = getNodeAt(x, y);
        
        if (clickedNode) {
            // First node selection
            if (!selectedNode) {
                selectedNode = clickedNode;
                updateStatus(`اختر العقدة الثانية للاتصال بـ ${selectedNode}`);
                return;
            }
            
            // If clicked same node → cancel
            if (selectedNode === clickedNode) {
                selectedNode = null;
                updateStatus('تم إلغاء الاختيار');
                return;
            }
            
            // Add edge
            const edge = [selectedNode, clickedNode].sort();
            const key = edge.join('-');
            
            if (!edges.some(e => e.join('-') === key)) {
                edges.push(edge);
                updateStatus(`تمت إضافة حافة بين ${edge[0]} و ${edge[1]}`);
            } else {
                updateStatus('الحافة موجودة بالفعل!');
            }
            
            // Clean up
            selectedNode = null;
            
            // Return to normal mode after adding one edge
            mode = 'normal';
            canvas.style.cursor = 'default';
            canvas.classList.remove('crosshair-cursor');
            document.querySelectorAll('.control-btn').forEach(btn => {
                btn.style.opacity = '1';
            });
            
            drawGraph();
            return;
        }
    }
});

// Dragging nodes
canvas.addEventListener('mousedown', (e) => {
    if (isRunning || mode !== 'normal') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const node = getNodeAt(x, y);
    if (node) {
        isDragging = true;
        dragNode = node;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && dragNode) {
        didDrag = true; // Mark that dragging occurred
        const rect = canvas.getBoundingClientRect();
        nodePositions[dragNode].x = e.clientX - rect.left;
        nodePositions[dragNode].y = e.clientY - rect.top;
        drawGraph();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    dragNode = null;
    
    // After release → prevent click
    setTimeout(() => (didDrag = false), 0);
});

// Get node at position
function getNodeAt(x, y) {
    const nodeRadius = 25;
    for (const node of nodes) {
        const pos = nodePositions[node];
        const dx = x - pos.x;
        const dy = y - pos.y;
        if (dx * dx + dy * dy <= nodeRadius * nodeRadius) {
            return node;
        }
    }
    return null;
}

// Draw graph
function drawGraph(highlighted = {}, visited = new Set(), path = []) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    edges.forEach(([from, to]) => {
        const fromPos = nodePositions[from];
        const toPos = nodePositions[to];
        
        let color = '#e2e8f0';
        let width = 2;
        
        // Highlight path edges
        if (path.length > 1) {
            for (let i = 0; i < path.length - 1; i++) {
                if ((path[i] === from && path[i + 1] === to) ||
                    (path[i] === to && path[i + 1] === from)) {
                    color = '#8b5cf6';
                    width = 4;
                    break;
                }
            }
        }
        
        if (highlighted.edge && 
            ((highlighted.edge[0] === from && highlighted.edge[1] === to) ||
             (highlighted.edge[0] === to && highlighted.edge[1] === from))) {
            color = '#8b5cf6';
            width = 4;
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
    });
    
    // Draw nodes
    nodes.forEach(node => {
        const pos = nodePositions[node];
        let color = '#ffffff';
        let borderColor = '#6366f1';
        let borderWidth = 3;
        
        if (highlighted.current === node) {
            color = '#8b5cf6';
            borderColor = '#7c3aed';
            borderWidth = 4;
        } else if (visited.has(node)) {
            color = '#10b981';
            borderColor = '#059669';
        }
        
        // Draw node circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.stroke();
        
        // Draw node label
        ctx.fillStyle = visited.has(node) || highlighted.current === node ? '#ffffff' : '#1e293b';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node, pos.x, pos.y);
    });
    
    // Draw selected node indicator
    if (selectedNode && mode === 'addEdge') {
        const pos = nodePositions[selectedNode];
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 30, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// DFS Algorithm (recursive)
async function startDFS() {
    if (isRunning) return;
    
    const startNode = document.getElementById('startNode').value.trim().toUpperCase();
    const targetNode = document.getElementById('targetNode').value.trim().toUpperCase();
    animationSpeed = parseInt(document.getElementById('speed').value);
    
    if (!nodes.includes(startNode)) {
        alert(`العقدة ${startNode} غير موجودة!`);
        return;
    }
    
    if (targetNode && !nodes.includes(targetNode)) {
        alert(`العقدة ${targetNode} غير موجودة!`);
        return;
    }
    
    isRunning = true;
    document.getElementById('startBtn').disabled = true;
    
    const visited = new Set();
    const parent = {};
    const explorationOrder = []; // Track complete exploration order
    let found = false;
    let path = [];
    
    parent[startNode] = null;
    
    updateStatus(`بدء DFS من العقدة ${startNode}${targetNode ? ` للبحث عن ${targetNode}` : ' (استكشاف كامل)'}...`);
    updateStack([]);
    
    // Recursive DFS function
    async function dfsRecursive(current) {
        // Mark as visited
        visited.add(current);
        explorationOrder.push(current);
        
        // Highlight current node
        path = getPath(parent, current);
        drawGraph({ current }, visited, path);
        updateStatus(`جارٍ استكشاف العقدة ${current}...`);
        updatePath(path);
        await sleep(animationSpeed);
        
        // Check if target found - RETURN IMMEDIATELY
        if (targetNode && current === targetNode) {
            found = true;
            path = getPath(parent, current);
            updateStatus(`تم العثور على الهدف ${targetNode}!`);
            updatePath(path);
            drawGraph({ current }, visited, path);
            return true; // Stop immediately when target is found
        }
        
        // Get neighbors
        const neighbors = edges
            .filter(([from, to]) => from === current || to === current)
            .map(([from, to]) => from === current ? to : from)
            .filter(neighbor => !visited.has(neighbor));
        
        // Recursively visit each neighbor
        for (const neighbor of neighbors) {
            if (found) return true; // Break if target already found
            
            // Set parent
            parent[neighbor] = current;
            
            // Highlight edge being explored
            path = getPath(parent, current);
            drawGraph({ 
                current, 
                edge: [current, neighbor] 
            }, visited, path);
            await sleep(animationSpeed / 2);
            
            // Recursive call
            const result = await dfsRecursive(neighbor);
            if (result) return true; // Target found, propagate up
        }
        
        return false; // Target not found in this branch
    }
    
    // Start recursive DFS
    await dfsRecursive(startNode);
    
    if (!found && targetNode) {
        updateStatus(`لم يتم العثور على العقدة ${targetNode}`);
        updatePath([]);
    } else if (!targetNode) {
        // Show complete exploration path
        updateStatus(`اكتمل استكشاف الرسم البياني. تمت زيارة ${visited.size} عقدة بالترتيب التالي:`);
        updatePath(explorationOrder);
    }
    
    // Final draw
    drawGraph({}, visited, path);
    updateStack([]);
    // Keep path visible - don't clear it
    
    isRunning = false;
    document.getElementById('startBtn').disabled = false;
}

// Get path from start to node
function getPath(parent, node) {
    const path = [];
    let current = node;
    while (current) {
        path.unshift(current);
        current = parent[current];
    }
    return path;
}

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

function updatePath(path) {
    const box = document.getElementById('pathDisplay');
    const items = document.getElementById('pathItems');
    
    if (path.length === 0) {
        box.style.display = 'none';
    } else {
        box.style.display = 'block';
        items.innerHTML = path.map(n => `<span class="path-item">${n}</span>`).join(' → ');
    }
}

function updateStack(stack) {
    const stackDisplay = document.getElementById('stackDisplay');
    const stackItems = document.getElementById('stackItems');
    
    if (stack.length === 0) {
        stackDisplay.style.display = 'none';
    } else {
        stackDisplay.style.display = 'flex';
        // Show stack in reverse order (top to bottom)
        stackItems.innerHTML = [...stack].reverse().map(node => 
            `<span class="stack-item">${node}</span>`
        ).join('');
    }
}

function resetGraph() {
    if (isRunning) return;
    drawGraph();
    updateStatus('تم إعادة تعيين الرسم البياني');
    updateStack([]);
    updatePath([]);
}

function clearGraph() {
    if (isRunning) return;
    if (confirm('هل أنت متأكد من مسح الرسم البياني بالكامل؟')) {
        nodes = [];
        edges = [];
        nodePositions = {};
        selectedNode = null;
        drawGraph();
        updateStatus('تم مسح الرسم البياني');
        updateStack([]);
        updatePath([]);
    }
}

function loadEdgesFromInput() {
    const text = document.getElementById('edgeInput').value.trim();
    if (!text) {
        alert('الرجاء إدخال الحواف أولاً');
        return;
    }

    nodes = [];
    edges = [];
    nodePositions = {};
    selectedNode = null;

    const lines = text.split('\n');

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length !== 2) continue;

        const u = parts[0];
        const v = parts[1];

        // إنشاء nodes إن لم تكن موجودة
        if (!nodes.includes(u)) nodes.push(u);
        if (!nodes.includes(v)) nodes.push(v);

        edges.push([u, v]);
    }

    autoLayoutNodes(); // توزيع تلقائي
    drawGraph();
    updateStatus('تم تحميل الرسم من الإدخال');
}

function autoLayoutNodes() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 80;

    const N = nodes.length;
    nodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / N;
        nodePositions[node] = {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        };
    });
}

// Initial draw
drawGraph();

