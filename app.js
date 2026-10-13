// UI for Husky Path: renders the course grid, planner, and prerequisite map.
// All graph logic lives in graph.js; this file only handles the DOM.

const TAKEN_KEY = "husky-path:taken";
const IN_PROGRESS_KEY = "husky-path:in-progress";
const SVG_NS = "http://www.w3.org/2000/svg";

const byId = indexCourses(COURSES);
const unlocks = buildUnlocks(COURSES);
let taken = loadSet(TAKEN_KEY);
let inProgress = loadSet(IN_PROGRESS_KEY);

// Validate the data once on load: a cycle would make planning impossible.
const cycle = detectCycle(COURSES);
if (cycle) console.error("Prerequisite cycle found:", cycle.join(" -> "));

// ---------- State ----------

function loadSet(key) {
  try {
    const ids = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(ids.filter(id => byId.has(id)));
  } catch {
    return new Set();
  }
}

function save() {
  try {
    localStorage.setItem(TAKEN_KEY, JSON.stringify([...taken]));
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify([...inProgress]));
  } catch {
    // Storage can be unavailable (private mode); the app still works without it.
  }
}

// "Available now" only counts finished courses. In-progress courses count as
// done when planning future quarters (see renderPlan).
function statusOf(course) {
  if (taken.has(course.id)) return "taken";
  if (inProgress.has(course.id)) return "in-progress";
  return isAvailable(course, taken) ? "available" : "locked";
}

// Clicking cycles: not taken -> taken -> in progress -> not taken.
function cycleStatus(id) {
  if (taken.has(id)) {
    taken.delete(id);
    inProgress.add(id);
  } else if (inProgress.has(id)) {
    inProgress.delete(id);
  } else {
    taken.add(id);
  }
  save();
  render();
}

// ---------- Helpers ----------

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.append(child);
  return node;
}

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function groupOf(id) {
  if (id.startsWith("MATH")) return "Math";
  const num = parseInt(id.split(" ")[1], 10);
  if (num < 200) return "Intro programming";
  if (num < 400) return "300-level";
  return "400-level";
}

const GROUPS = ["Intro programming", "Math", "300-level", "400-level"];

function credits(ids) {
  return [...ids].reduce((sum, id) => sum + byId.get(id).credits, 0);
}

// ---------- Header stats ----------

function renderStats() {
  const available = COURSES.filter(c => statusOf(c) === "available").length;
  const stats = document.getElementById("stats");
  stats.replaceChildren(
    el("span", { class: "stat" }, [el("strong", { text: taken.size }), " courses taken"]),
    el("span", { class: "stat" }, [el("strong", { text: credits(taken) }), " credits"]),
    el("span", { class: "stat" }, [el("strong", { text: inProgress.size }), " in progress"]),
    el("span", { class: "stat" }, [el("strong", { text: available }), " available now"]),
  );
}

// ---------- Course grid ----------

function noteFor(course, status) {
  if (status === "taken") {
    const n = unlocks.get(course.id).length;
    return n ? `Leads to ${n} course${n === 1 ? "" : "s"}` : "Taken";
  }
  if (status === "in-progress") return "In progress";
  if (status === "available") return "Available now";
  const missing = missingClauses(course, taken).map(clause => clause.join(" or "));
  return "Needs " + missing.join(", ");
}

function renderGrid() {
  const container = document.getElementById("course-groups");
  container.replaceChildren();

  for (const group of GROUPS) {
    const grid = el("div", { class: "grid" });
    for (const course of COURSES.filter(c => groupOf(c.id) === group)) {
      const status = statusOf(course);
      const button = el("button", {
        type: "button",
        class: `course ${status}`,
        "aria-pressed": String(status === "taken"),
      }, [
        el("span", { class: "id", text: course.id }),
        el("span", { class: "title", text: course.title }),
        el("span", { class: "note", text: noteFor(course, status) }),
      ]);
      button.addEventListener("click", () => cycleStatus(course.id));
      grid.append(button);
    }
    container.append(el("h3", { class: "group-title", text: group }), grid);
  }
}

// ---------- Planner ----------

const targetSelect = document.getElementById("target");
const maxSelect = document.getElementById("max-per-quarter");

function renderTargetOptions() {
  const previous = targetSelect.value || "CSE 452";
  targetSelect.replaceChildren();
  for (const group of GROUPS) {
    const optgroup = el("optgroup", { label: group });
    for (const c of COURSES.filter(c => groupOf(c.id) === group)) {
      optgroup.append(el("option", { value: c.id, text: `${c.id}: ${c.title}` }));
    }
    targetSelect.append(optgroup);
  }
  targetSelect.value = previous;
}

function renderPlan() {
  const out = document.getElementById("plan");
  const target = targetSelect.value;
  const max = parseInt(maxSelect.value, 10);

  if (taken.has(target)) {
    out.replaceChildren(el("p", { class: "empty", text: `You've already taken ${target}.` }));
    return;
  }
  if (inProgress.has(target)) {
    out.replaceChildren(el("p", { class: "empty", text: `You're taking ${target} right now.` }));
    return;
  }

  // Plan from next quarter: assume current courses will be finished.
  const done = new Set([...taken, ...inProgress]);
  let result;
  try {
    result = planQuarters([target], byId, done, max);
  } catch (err) {
    out.replaceChildren(el("p", { class: "error", text: err.message }));
    return;
  }

  const { quarters, needed } = result;
  const summary = el("p", { class: "plan-summary" }, [
    "You need ", el("strong", { text: `${needed.size} course${needed.size === 1 ? "" : "s"}` }),
    ` (${credits(needed)} credits) over `,
    el("strong", { text: `${quarters.length} quarter${quarters.length === 1 ? "" : "s"}` }),
    ` to reach ${target}.`,
    inProgress.size
      ? ` Quarter 1 is next quarter and assumes you finish your ${inProgress.size} in-progress course${inProgress.size === 1 ? "" : "s"}.`
      : "",
  ]);

  const list = el("ol", { class: "quarters" });
  quarters.forEach((quarter, i) => {
    const items = quarter.map(id =>
      el("li", { class: id === target ? "target" : "", text: `${id}: ${byId.get(id).title}` }));
    list.append(el("li", { class: "quarter" }, [
      el("h3", {}, [`Quarter ${i + 1}`, el("span", { text: `${credits(quarter)} cr` })]),
      el("ul", {}, items),
    ]));
  });

  out.replaceChildren(summary, list);
}

targetSelect.addEventListener("change", renderPlan);
maxSelect.addEventListener("change", renderPlan);

// ---------- Prerequisite map (SVG) ----------

const graphEl = document.getElementById("graph");
const NODE_W = 92, NODE_H = 28, COL_GAP = 150, ROW_GAP = 38, PAD = 24, TOP = 36;
const nodeEls = new Map();
const edgeEls = []; // { from, to, path }

function buildGraphView() {
  const depth = depths(COURSES);
  const columns = [];
  for (const c of COURSES) {
    const d = depth.get(c.id);
    (columns[d] ||= []).push(c.id);
  }

  // Position every node: x by depth column, y by order in that column.
  const pos = new Map();
  columns.forEach((ids, col) => {
    ids.sort((a, b) => a.localeCompare(b));
    ids.forEach((id, row) => {
      pos.set(id, { x: PAD + col * COL_GAP, y: TOP + row * ROW_GAP });
    });
  });

  const width = PAD * 2 + (columns.length - 1) * COL_GAP + NODE_W;
  const height = TOP + Math.max(...columns.map(c => c.length)) * ROW_GAP + PAD;
  graphEl.setAttribute("width", width);
  graphEl.setAttribute("height", height);
  graphEl.setAttribute("viewBox", `0 0 ${width} ${height}`);

  columns.forEach((_, col) => {
    const label = svg("text", { class: "col-label", x: PAD + col * COL_GAP + NODE_W / 2, y: 18 });
    label.textContent = col === 0 ? "No prereqs" : `Chain of ${col}`;
    graphEl.append(label);
  });

  // Edges first so nodes draw on top. Curves go from the right side of the
  // prerequisite to the left side of the course it unlocks.
  for (const course of COURSES) {
    for (const clause of course.prereqs) {
      for (const p of clause) {
        const a = pos.get(p), b = pos.get(course.id);
        const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2;
        const x2 = b.x, y2 = b.y + NODE_H / 2;
        const mid = (x1 + x2) / 2;
        const path = svg("path", {
          class: clause.length > 1 ? "edge or" : "edge",
          d: `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`,
        });
        graphEl.append(path);
        edgeEls.push({ from: p, to: course.id, path });
      }
    }
  }

  for (const course of COURSES) {
    const { x, y } = pos.get(course.id);
    const g = svg("g", { class: "node", tabindex: "0", role: "button", "aria-label": `${course.id}: ${course.title}` });
    const title = svg("title");
    title.textContent = `${course.id}: ${course.title}`;
    g.append(
      title,
      svg("rect", { x, y, width: NODE_W, height: NODE_H, rx: 6 }),
      Object.assign(svg("text", { x: x + NODE_W / 2, y: y + NODE_H / 2 }), { textContent: course.id }),
    );
    g.addEventListener("mouseenter", () => focusNode(course.id));
    g.addEventListener("mouseleave", clearFocus);
    g.addEventListener("focus", () => focusNode(course.id));
    g.addEventListener("blur", clearFocus);
    g.addEventListener("click", () => cycleStatus(course.id));
    graphEl.append(g);
    nodeEls.set(course.id, g);
  }
}

function focusNode(id) {
  const chain = ancestors(id, byId);
  chain.add(id);
  graphEl.classList.add("focusing");
  for (const [nid, node] of nodeEls) {
    node.classList.toggle("hl", chain.has(nid));
    node.classList.toggle("focus", nid === id);
  }
  for (const e of edgeEls) e.path.classList.toggle("hl", chain.has(e.from) && chain.has(e.to));
}

function clearFocus() {
  graphEl.classList.remove("focusing");
  for (const node of nodeEls.values()) node.classList.remove("hl", "focus");
  for (const e of edgeEls) e.path.classList.remove("hl");
}

function renderGraphStatus() {
  for (const course of COURSES) {
    const node = nodeEls.get(course.id);
    node.classList.remove("taken", "in-progress", "available", "locked");
    node.classList.add(statusOf(course));
  }
}

// ---------- Wire up ----------

function render() {
  renderStats();
  renderGrid();
  renderPlan();
  renderGraphStatus();
}

document.getElementById("reset").addEventListener("click", () => {
  taken = new Set();
  inProgress = new Set();
  save();
  render();
});

// A typical student partway through the core, so first-time visitors see something.
document.getElementById("example").addEventListener("click", () => {
  taken = new Set(["CSE 121", "CSE 122", "CSE 123", "MATH 124", "MATH 125", "MATH 126",
                   "CSE 311", "CSE 331", "CSE 332", "CSE 351"]);
  inProgress = new Set(["CSE 414"]);
  save();
  render();
});

renderTargetOptions();
buildGraphView();
render();

// Demo link: index.html?example opens with the example student loaded.
if (new URLSearchParams(location.search).has("example")) {
  document.getElementById("example").click();
}
