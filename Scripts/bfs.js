// Graph data structure
let nodes = [];
let edges = [];
let nodePositions = {};
let mode = "normal";
let isRunning = false;
let animationSpeed = 500;
// Interaction state
let selectedNode = null;
let isDragging = false;
let dragNode = null;
let didDrag = false;

// Canvas setup
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

// ========================================================
// CANVAS RESIZING
// ========================================================

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  drawGraph();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();



function initDefaultGraph() {
  nodes = ["A", "B", "C", "D", "E", "F"];
  edges = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["B", "E"],
    ["C", "F"],
    ["D", "E"],
  ];

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  nodePositions = {
    A: { x: centerX, y: 100 },
    B: { x: centerX - 150, y: 250 },
    C: { x: centerX + 150, y: 250 },
    D: { x: centerX - 200, y: 400 },
    E: { x: centerX - 100, y: 400 },
    F: { x: centerX + 150, y: 400 },
  };

  drawGraph();
}

initDefaultGraph();

// ========================================================
// INTERACTION MODE
// ========================================================

function setMode(newMode, button) {
  if (isRunning) return;

  mode = newMode;

  document
    .querySelectorAll(".control-btn")
    .forEach((btn) => (btn.style.opacity = "1"));
  if (button) button.style.opacity = "0.7";

  if (mode === "addNode") {
    canvas.style.cursor = "crosshair";
    canvas.classList.add("crosshair-cursor");
    updateStatus("انقر لإضافة عقدة جديدة");
} else if (mode === "addEdge") {
    canvas.style.cursor = "crosshair";
    canvas.classList.add("crosshair-cursor");
    updateStatus("انقر لاختيار العقدة الأولى لإضافة حافة");
}
   else {
    canvas.style.cursor = "default";
    canvas.classList.remove("crosshair-cursor");
    updateStatus("الوضع العادي");
  }
}

// ========================================================
// CANVAS CLICK HANDLING
// ========================================================

canvas.addEventListener("click", (e) => {
  if (isRunning) return;
  if (didDrag) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // -------------------
  // ADD NODE MODE
  // -------------------
  if (mode === "addNode") {
    const nodeName = prompt(
      "أدخل اسم العقدة:",
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
        alert("العقدة موجودة بالفعل!");
      }
    }

    mode = "normal";
    canvas.style.cursor = "default";
    canvas.classList.remove("crosshair-cursor");
    document
      .querySelectorAll(".control-btn")
      .forEach((btn) => (btn.style.opacity = "1"));

    return;
  }

if (mode === "addEdge") {
    const clickedNode = getNodeAt(x, y);

    if (clickedNode) {
        if (!selectedNode) {
            selectedNode = clickedNode;
            updateStatus(`اختر العقدة الثانية للاتصال بـ ${selectedNode}`);
            return;
        }

        if (selectedNode === clickedNode) {
            selectedNode = null;
            updateStatus("تم إلغاء الاختيار");
            return;
        }

        const edge = [selectedNode, clickedNode].sort();
        const key = edge.join("-");

        if (!edges.some((e) => e.join("-") === key)) {
            edges.push(edge);
            updateStatus(`تمت إضافة حافة بين ${edge[0]} و ${edge[1]}`);
        } else {
            updateStatus("الحافة موجودة بالفعل!");
        }

        selectedNode = null;

        mode = "normal";
        canvas.style.cursor = "default";
        canvas.classList.remove("crosshair-cursor");
        document
            .querySelectorAll(".control-btn")
            .forEach((btn) => (btn.style.opacity = "1"));

        drawGraph();
        return;
    }
}
});

// ========================================================
// DRAGGING NODES
// ========================================================

canvas.addEventListener("mousedown", (e) => {
  if (isRunning || mode !== "normal") return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const node = getNodeAt(x, y);
  if (node) {
    isDragging = true;
    dragNode = node;
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging && dragNode) {
    didDrag = true; // <-- تم السحب
    const rect = canvas.getBoundingClientRect();
    nodePositions[dragNode].x = e.clientX - rect.left;
    nodePositions[dragNode].y = e.clientY - rect.top;
    drawGraph();
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  dragNode = null;

  setTimeout(() => (didDrag = false), 0);
});


function getNodeAt(x, y) {
  const r = 25;

  for (const node of nodes) {
    const pos = nodePositions[node];
    const dx = x - pos.x;
    const dy = y - pos.y;

    if (dx * dx + dy * dy <= r * r) return node;
  }
  return null;
}


function drawGraph(highlighted = {}, queue = [], visited = new Set(), path = [], levelColors = {}) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  edges.forEach(([from, to]) => {
    const p1 = nodePositions[from];
    const p2 = nodePositions[to];

    let color = "#e2e8f0";
    let width = 2;

    if (path.length > 1) {
      for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === from && path[i + 1] === to) ||
            (path[i] === to && path[i + 1] === from)) {
          color = "#8b5cf6";
          width = 4;
          break;
        }
      }
    }

    if (
      highlighted.edge &&
      ((highlighted.edge[0] === from && highlighted.edge[1] === to) ||
        (highlighted.edge[0] === to && highlighted.edge[1] === from))
    ) {
      color = "#6366f1";
      width = 4;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  // Draw nodes
  nodes.forEach((node) => {
    const pos = nodePositions[node];

    let fill = "#ffffff";
    let border = "#6366f1";
    let borderWidth = 3;

    if (highlighted.current === node) {
      fill = "#6366f1";
      border = "#4f46e5";
      borderWidth = 4;
    } else if (levelColors[node]) {
      fill = levelColors[node];
      border = levelColors[node];
    } else if (visited.has(node)) {
      fill = "#10b981";
      border = "#059669";
    } else if (queue.includes(node)) {
      fill = "#f59e0b";
      border = "#d97706";
    }

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = border;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    ctx.fillStyle =
      visited.has(node) || highlighted.current === node || levelColors[node] ? "#ffffff" : "#1e293b";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node, pos.x, pos.y);
  });

  if (selectedNode && mode === "addEdge") {
    const pos = nodePositions[selectedNode];
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 30, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ========================================================
// BFS Algorithm (unchanged logic)
// ========================================================

async function startBFS() {
  if (isRunning) return;

  const startNode = document
    .getElementById("startNode")
    .value.trim()
    .toUpperCase();
  const targetNode = document
    .getElementById("targetNode")
    .value.trim()
    .toUpperCase();
  animationSpeed = parseInt(document.getElementById("speed").value);

  if (!nodes.includes(startNode))
    return alert(`العقدة ${startNode} غير موجودة!`);
  if (targetNode && !nodes.includes(targetNode))
    return alert(`العقدة ${targetNode} غير موجودة!`);

  isRunning = true;
  document.getElementById("startBtn").disabled = true;

  const queue = [{ node: startNode, level: 0 }];
  const visited = new Set([startNode]);
  const parent = { [startNode]: null };
  const levelColors = {};
  const explorationOrder = [startNode];
  const levelColorPalette = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b", 
    "#10b981",
    "#06b6d4",
    "#f97316",
    "#84cc16",
  ];

  levelColors[startNode] = levelColorPalette[0];

  updateStatus(`بدء BFS من العقدة ${startNode}${targetNode ? ` للبحث عن ${targetNode}` : ' (استكشاف كامل)'}...`);
  updateQueue([startNode]);

  let found = false;
  let path = [];

  while (queue.length && !found) {
    const { node: current, level: currentLevel } = queue.shift();

    path = getPath(parent, current);
    drawGraph({ current }, queue.map(q => q.node), visited, path, levelColors);
    updateStatus(`جارٍ استكشاف العقدة ${current} (المستوى ${currentLevel})...`);
    updatePath(path);
    await sleep(animationSpeed);

    if (targetNode && current === targetNode) {
      found = true;
      path = getPath(parent, current);
      updateStatus(`تم العثور على الهدف ${targetNode}!`);
      updatePath(path);
      drawGraph({ current }, queue.map(q => q.node), visited, path, levelColors);
      break;
    }

    const neighbors = edges
      .filter(([f, t]) => f === current || t === current)
      .map(([f, t]) => (f === current ? t : f))
      .filter((n) => !visited.has(n));

    const nextLevel = currentLevel + 1;

    for (const nb of neighbors) {
      visited.add(nb);
      parent[nb] = current;
      queue.push({ node: nb, level: nextLevel });
      explorationOrder.push(nb);

      const colorIndex = nextLevel % levelColorPalette.length;
      levelColors[nb] = levelColorPalette[colorIndex];

      path = getPath(parent, current);
      drawGraph({ current, edge: [current, nb] }, queue.map(q => q.node), visited, path, levelColors);
      await sleep(animationSpeed / 2);
    }

    updateQueue(queue.map(q => q.node));
    path = getPath(parent, current);
    drawGraph({ current }, queue.map(q => q.node), visited, path, levelColors);
    updatePath(path);
    await sleep(animationSpeed);
  }

  if (!found && targetNode) {
    updateStatus(`لم يتم العثور على العقدة ${targetNode}`);
    updatePath([]);
  } else if (!targetNode) {
    updateStatus(`اكتمل استكشاف الرسم البياني. تمت زيارة ${visited.size} عقدة بالترتيب التالي:`);
    updatePath(explorationOrder);
  }

  drawGraph({}, [], visited, path, levelColors);
  updateQueue([]);

  isRunning = false;
  document.getElementById("startBtn").disabled = false;
}

// ========================================================
// UTILITY
// ========================================================

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function updateStatus(text) {
  document.getElementById("statusText").textContent = text;
}

function getPath(parent, node) {
  const path = [];
  let current = node;
  while (current) {
    path.unshift(current);
    current = parent[current];
  }
  return path;
}

function updateQueue(queue) {
  const box = document.getElementById("queueDisplay");
  const items = document.getElementById("queueItems");

  if (queue.length === 0) {
    box.style.display = "none";
  } else {
    box.style.display = "flex";
    items.innerHTML = queue
      .map((n) => `<span class="queue-item">${n}</span>`)
      .join("");
  }
}

function updatePath(path) {
  const box = document.getElementById("pathDisplay");
  const items = document.getElementById("pathItems");

  if (path.length === 0) {
    box.style.display = "none";
  } else {
    box.style.display = "block";
    items.innerHTML = path
      .map((n) => `<span class="path-item">${n}</span>`)
      .join(" → ");
  }
}

function resetGraph() {
  if (isRunning) return;
  drawGraph();
  updateStatus("تم إعادة تعيين الرسم البياني");
  updateQueue([]);
  updatePath([]);
}

function clearGraph() {
  if (isRunning) return;
  if (confirm("هل أنت متأكد من مسح الرسم البياني بالكامل؟")) {
    nodes = [];
    edges = [];
    nodePositions = {};
    selectedNode = null;
    drawGraph();
    updateStatus("تم مسح الرسم البياني");
    updateQueue([]);
    updatePath([]);
  }
}

// ========================================================
// INITIAL DRAW
// ========================================================

drawGraph();
function loadEdgesFromInput() {
  const text = document.getElementById("edgeInput").value.trim();
  if (!text) {
    alert("الرجاء إدخال الحواف أولاً");
    return;
  }

  nodes = [];
  edges = [];
  nodePositions = {};
  selectedNode = null;

  const lines = text.split("\n");

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 2) continue;

    const u = parts[0];
    const v = parts[1];

    if (!nodes.includes(u)) nodes.push(u);
    if (!nodes.includes(v)) nodes.push(v);

    edges.push([u, v]);
  }

  autoLayoutNodes();
  drawGraph();
  updateStatus("تم تحميل الرسم من الإدخال");
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
