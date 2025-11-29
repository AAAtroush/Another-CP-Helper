const grid = document.getElementById("grid");
const rowsInput = document.getElementById("rows");
const colsInput = document.getElementById("cols");
const cellSizeInput = document.getElementById("cellSize");
const colorPicker = document.getElementById("colorPicker");

cellSizeInput.max = Math.floor(cellSizeInput.max * 0.6);

const importBtn = document.getElementById("importCF");
const exportBtn = document.getElementById("exportCF");
const clearBtn = document.getElementById("clearAll");

const fillValueInput = document.getElementById("fillValueInput");
const fillValueBtn = document.getElementById("fillValueBtn");
const fillRandomBtn = document.getElementById("fillRandom");
const fillBinaryBtn = document.getElementById("fillBinary");
const randomGridBtn = document.getElementById("randomGrid");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const saveTemplateBtn = document.getElementById("saveTemplate");
const loadTemplateBtn = document.getElementById("loadTemplate");

const toggleInputsBtn = document.getElementById("toggleInputs");

const toggleIndicesBtn = document.getElementById("toggleIndices");
const indexModeBtn = document.getElementById("indexMode");

const rotateCWBtn = document.getElementById("rotateCW");
const rotateCCWBtn = document.getElementById("rotateCCW");

let showIndices = false;
let oneBased = false;
let inputsDisabled = false;

let painting = false;
let erasing = false;
let isInitializing = false;

let history = [];
let historyIndex = -1;
const MAX_HISTORY = 80;

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.remove("active"));

    const id = btn.dataset.tab;
    document.getElementById(id).classList.add("active");
  });
});

function currentStateSnapshot() {
  const rows = +rowsInput.value || 1;
  const cols = +colsInput.value || 1;
  const arr = [];
  for (let r = 0; r < rows; r++) {
    const rowArr = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      rowArr.push({
        color: cell?.style.backgroundColor || "",
        value: cell?.querySelector("input")?.value || "",
      });
    }
    arr.push(rowArr);
  }
  return { rows: +rowsInput.value, cols: +colsInput.value, data: arr };
}

function stateToKey(state) {
  return JSON.stringify(state);
}

function saveHistory() {
  if (isInitializing) return;
  const snap = currentStateSnapshot();
  const key = stateToKey(snap);
  const last = history[historyIndex];
  if (last && stateToKey(last) === key) return;

  // truncate future
  history = history.slice(0, historyIndex + 1);
  history.push(snap);
  historyIndex = history.length - 1;

  // enforce max size
  if (history.length > MAX_HISTORY) {
    history.shift();
    historyIndex = history.length - 1;
  }

  updateUndoRedoButtons();
}

function loadHistoryState(index = historyIndex) {
  if (index < 0 || index >= history.length) return;
  const snap = history[index];

  isInitializing = true;
  rowsInput.value = snap.rows;
  colsInput.value = snap.cols;

  buildGrid(false);

  for (let r = 0; r < snap.rows; r++) {
    for (let c = 0; c < snap.cols; c++) {
      const item = snap.data[r][c];
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (!cell) continue;
      cell.style.backgroundColor = item.color || "white";
      const inp = cell.querySelector("input");
      if (inp) inp.value = item.value;
    }
  }

  isInitializing = false;

  // Set historyIndex and update UI buttons
  historyIndex = index;
  updateIndices();
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (undoBtn) undoBtn.disabled = historyIndex <= 0;
  if (redoBtn)
    redoBtn.disabled =
      historyIndex >= history.length - 1 || history.length === 0;
}

toggleIndicesBtn?.addEventListener("click", () => {
  showIndices = !showIndices;
  updateIndices();
});

indexModeBtn?.addEventListener("click", () => {
  oneBased = !oneBased;
  indexModeBtn.textContent = oneBased ? "1-Based Index" : "0-Based Index";
  updateIndices();
});

function updateIndices() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    let span = cell.querySelector(".index");
    const row = +cell.dataset.row;
    const col = +cell.dataset.col;
    const displayRow = oneBased ? row + 1 : row;
    const displayCol = oneBased ? col + 1 : col;
    if (showIndices && !span) {
      span = document.createElement("span");
      span.classList.add("index");
      span.textContent = `${displayRow},${displayCol}`;
      cell.appendChild(span);
    } else if (showIndices && span) {
      span.textContent = `${displayRow},${displayCol}`;
    } else if (!showIndices && span) {
      span.remove();
    }
  });
}

function buildGrid(save = true) {
  const rows = +rowsInput.value || 1;
  const cols = +colsInput.value || 1;

  // preserve old cells by coordinates
  const old = Array.from(grid.children).map((cell) => ({
    row: +cell.dataset.row,
    col: +cell.dataset.col,
    color: cell.style.backgroundColor,
    value: cell.querySelector("input")?.value || "",
  }));

  isInitializing = true;
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
  grid.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.style.backgroundColor = "white";

      const match = old.find((o) => o.row === r && o.col === c);
      if (match) {
        cell.style.backgroundColor = match.color || "white";
      }

      // events: click paint, contextmenu erase
      cell.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
          cell.style.backgroundColor = colorPicker.value;
          saveHistory();
        } else if (e.button === 2) {
          cell.style.backgroundColor = "white";
          saveHistory();
        }
      });

      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      cell.addEventListener("mouseover", () => {
        if (painting) {
          cell.style.backgroundColor = colorPicker.value;
        } else if (erasing) {
          cell.style.backgroundColor = "white";
        }
      });

      const input = document.createElement("input");
      input.type = "text";
      input.value = match ? match.value : "";
      input.addEventListener("input", () => {
        if (!isInitializing) saveHistory();
      });
      cell.appendChild(input);

      if (showIndices) {
        const span = document.createElement("span");
        span.classList.add("index");
        const displayRow = oneBased ? r + 1 : r;
        const displayCol = oneBased ? c + 1 : c;
        span.textContent = `${displayRow},${displayCol}`;
        cell.appendChild(span);
      }

      grid.appendChild(cell);
    }
  }

  isInitializing = false;

  if (save) saveHistory();
}

function importCFInput() {
  const ta = document.getElementById("cfInput");
  if (!ta) return alert("CF input textarea not found.");
  const text = ta.value.trim();
  if (!text) return alert("Input is empty.");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const matrix = lines.map((l) =>
    l.split(/\s+/).map((v) => (v === "" ? "" : Number(v)))
  );

  const rows = matrix.length;
  const cols = matrix[0].length;
  for (let r = 0; r < rows; r++) {
    if (matrix[r].length !== cols) {
      return alert("Error: Not all rows have the same number of columns.");
    }
  }

  rowsInput.value = rows;
  colsInput.value = cols;
  buildGrid();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (cell) cell.querySelector("input").value = matrix[r][c];
    }
  }
  saveHistory();
  updateIndices();
}

async function exportCF() {
  const rows = +rowsInput.value || 1;
  const cols = +colsInput.value || 1;
  let out = "";
  for (let r = 0; r < rows; r++) {
    const line = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      const v = cell?.querySelector("input")?.value;
      line.push(v === undefined || v === "" ? "0" : String(v));
    }
    out += line.join(" ") + (r < rows - 1 ? "\n" : "");
  }

  try {
    await navigator.clipboard.writeText(out);
    alert("CF grid copied to clipboard!");
  } catch (err) {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = out;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("Copied (fallback).");
  }
}

function clearAll() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.style.backgroundColor = "white";
    const inp = cell.querySelector("input");
    if (inp) inp.value = "";
  });
  saveHistory();
  updateIndices();
}

function fillWithValue() {
  const v = fillValueInput?.value ?? "";
  document.querySelectorAll(".cell input").forEach((inp) => (inp.value = v));
  saveHistory();
}

function fillRandom() {
  document.querySelectorAll(".cell input").forEach((inp) => {
    inp.value = Math.floor(Math.random() * 10);
  });
  saveHistory();
}

function fillBinary() {
  document.querySelectorAll(".cell input").forEach((inp) => {
    inp.value = Math.random() < 0.5 ? 0 : 1;
  });
  saveHistory();
}

function generateRandomGrid() {
  // random values 0..99; keep current dims
  const rows = +rowsInput.value || 1;
  const cols = +colsInput.value || 1;
  buildGrid();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (cell)
        cell.querySelector("input").value = Math.floor(Math.random() * 100);
    }
  }
  saveHistory();
}

function undo() {
  if (historyIndex <= 0) return;
  const newIndex = historyIndex - 1;
  loadHistoryState(newIndex);
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  const newIndex = historyIndex + 1;
  loadHistoryState(newIndex);
}

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undo();
  } else if (
    (e.ctrlKey || e.metaKey) &&
    (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
  ) {
    e.preventDefault();
    redo();
  }
});

const TEMPLATE_KEY = "gridTemplate_v1";

function saveTemplate() {
  const snap = currentStateSnapshot();
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(snap));
  alert("Template saved to localStorage.");
}

function loadTemplate() {
  const raw = localStorage.getItem(TEMPLATE_KEY);
  if (!raw) return alert("No template found in localStorage.");
  const obj = JSON.parse(raw);
  if (!obj || !obj.rows || !obj.cols || !obj.data)
    return alert("Template corrupted.");
  isInitializing = true;
  rowsInput.value = obj.rows;
  colsInput.value = obj.cols;
  buildGrid();
  for (let r = 0; r < obj.rows; r++) {
    for (let c = 0; c < obj.cols; c++) {
      const item = obj.data[r][c];
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (!cell) continue;
      cell.style.backgroundColor = item.color || "white";
      const inp = cell.querySelector("input");
      if (inp) inp.value = item.value;
    }
  }
  isInitializing = false;
  saveHistory();
  updateIndices();
}

function toggleInputs() {
  inputsDisabled = !inputsDisabled;
  document
    .querySelectorAll(".cell input")
    .forEach((inp) => (inp.disabled = inputsDisabled));
  toggleInputsBtn.textContent = inputsDisabled
    ? "Enable Inputs"
    : "Disable Inputs";
}

function rotateGrid(clockwise = true) {
  const rows = +rowsInput.value || 1;
  const cols = +colsInput.value || 1;
  // read grid
  const matrix = [];
  for (let r = 0; r < rows; r++) {
    const rowArr = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      rowArr.push({
        color: cell?.style.backgroundColor || "white",
        value: cell?.querySelector("input")?.value || "",
      });
    }
    matrix.push(rowArr);
  }

  let newMatrix;
  if (clockwise) {
    newMatrix = matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
  } else {
    newMatrix = matrix[0].map((_, i) =>
      matrix.map((row) => row[row.length - 1 - i])
    );
  }

  rowsInput.value = newMatrix.length;
  colsInput.value = newMatrix[0].length;
  buildGrid();

  for (let r = 0; r < newMatrix.length; r++) {
    for (let c = 0; c < newMatrix[0].length; c++) {
      const item = newMatrix[r][c];
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (!cell) continue;
      cell.style.backgroundColor = item.color || "white";
      const inp = cell.querySelector("input");
      if (inp) inp.value = item.value;
    }
  }
  saveHistory();
  updateIndices();
}

document.addEventListener("mousedown", (e) => {
  // left button = paint, right button = erase
  if (e.button === 0) painting = true;
  if (e.button === 2) erasing = true;
});
document.addEventListener("mouseup", (e) => {
  if (painting || erasing) saveHistory();
  painting = false;
  erasing = false;
});
grid.addEventListener("contextmenu", (e) => e.preventDefault());

function updateCellSize() {
  const size = cellSizeInput.value + "px";
  document.documentElement.style.setProperty("--cell-size", size);
  buildGrid();
}

cellSizeInput.addEventListener("input", updateCellSize);
rowsInput.addEventListener("input", buildGrid);
colsInput.addEventListener("input", buildGrid);

importBtn?.addEventListener("click", importCFInput);
exportBtn?.addEventListener("click", exportCF);
clearBtn?.addEventListener("click", clearAll);

fillValueBtn?.addEventListener("click", fillWithValue);
fillRandomBtn?.addEventListener("click", fillRandom);
fillBinaryBtn?.addEventListener("click", fillBinary);
randomGridBtn?.addEventListener("click", generateRandomGrid);

undoBtn?.addEventListener("click", undo);
redoBtn?.addEventListener("click", redo);

saveTemplateBtn?.addEventListener("click", saveTemplate);
loadTemplateBtn?.addEventListener("click", loadTemplate);

toggleInputsBtn?.addEventListener("click", toggleInputs);

rotateCWBtn?.addEventListener("click", () => rotateGrid(true));
rotateCCWBtn?.addEventListener("click", () => rotateGrid(false));

buildGrid();
updateCellSize();
updateIndices();
updateUndoRedoButtons();

// Formulas tabs
document.querySelectorAll(".formulas-tab-btn").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".formulas-tab-btn")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".formula-section")
      .forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});
