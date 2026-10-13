// Graph algorithms for Husky Path.
// Pure functions only (no DOM), so they can be unit tested in tests.html.
//
// The course catalog is a directed acyclic graph (DAG):
//   an edge  A -> B  means "A is a prerequisite of B".
// Because prerequisites can be ORs, each course stores its prereqs as
// a list of clauses; every clause must be satisfied by at least one option.

/** Index courses by id: Map<id, course>. */
function indexCourses(courses) {
  const byId = new Map();
  for (const c of courses) byId.set(c.id, c);
  return byId;
}

/** Every course id mentioned in a course's prereqs (all OR options). */
function prereqIds(course) {
  return course.prereqs.flat();
}

/** Forward edges: Map<id, ids it unlocks>. Used for highlighting and layout. */
function buildUnlocks(courses) {
  const unlocks = new Map(courses.map(c => [c.id, []]));
  for (const c of courses) {
    for (const p of prereqIds(c)) {
      if (unlocks.has(p)) unlocks.get(p).push(c.id);
    }
  }
  return unlocks;
}

/** True if every clause has at least one option in `done`. */
function isAvailable(course, done) {
  return course.prereqs.every(clause => clause.some(id => done.has(id)));
}

/** The clauses that are not yet satisfied, e.g. [["CSE 123","CSE 143"]]. */
function missingClauses(course, done) {
  return course.prereqs.filter(clause => !clause.some(id => done.has(id)));
}

/**
 * Cycle detection with three-color DFS.
 * white = unvisited, gray = on the current DFS path, black = finished.
 * Reaching a gray node again means we found a back edge, i.e. a cycle.
 * Returns the cycle as a list of ids, or null if the graph is a DAG.
 */
function detectCycle(courses) {
  const byId = indexCourses(courses);
  const color = new Map();
  const path = [];

  function visit(id) {
    color.set(id, "gray");
    path.push(id);
    const course = byId.get(id);
    for (const p of course ? prereqIds(course) : []) {
      if (color.get(p) === "gray") return path.slice(path.indexOf(p)).concat(p);
      if (!color.has(p)) {
        const cycle = visit(p);
        if (cycle) return cycle;
      }
    }
    path.pop();
    color.set(id, "black");
    return null;
  }

  for (const c of courses) {
    if (!color.has(c.id)) {
      const cycle = visit(c.id);
      if (cycle) return cycle;
    }
  }
  return null;
}

/**
 * Depth of each course = length of its longest prerequisite chain.
 * (Longest path in a DAG, computed with memoized DFS.)
 * Used to lay out the graph in columns.
 */
function depths(courses) {
  const byId = indexCourses(courses);
  const memo = new Map();

  function depth(id) {
    if (memo.has(id)) return memo.get(id);
    const course = byId.get(id);
    let d = 0;
    for (const p of course ? prereqIds(course) : []) d = Math.max(d, depth(p) + 1);
    memo.set(id, d);
    return d;
  }

  for (const c of courses) depth(c.id);
  return memo;
}

/** Every course that appears anywhere in id's prerequisite tree (all options). */
function ancestors(id, byId) {
  const seen = new Set();
  const stack = [id];
  while (stack.length) {
    const course = byId.get(stack.pop());
    for (const p of course ? prereqIds(course) : []) {
      if (!seen.has(p)) {
        seen.add(p);
        stack.push(p);
      }
    }
  }
  return seen;
}

/**
 * The set of courses you still need to take to reach `targetId`
 * (including the target itself), given what you've already taken.
 *
 * For an OR clause that isn't already satisfied, we greedily pick the
 * option that requires the fewest extra courses.
 */
function requiredFor(targetId, byId, taken) {
  const memo = new Map();

  function need(id) {
    if (taken.has(id)) return new Set();
    if (memo.has(id)) return memo.get(id);
    const result = new Set([id]);
    const course = byId.get(id);
    for (const clause of course ? course.prereqs : []) {
      if (clause.some(opt => taken.has(opt))) continue;
      let best = null;
      for (const opt of clause) {
        const cost = need(opt);
        if (best === null || cost.size < best.size) best = cost;
      }
      for (const x of best) result.add(x);
    }
    memo.set(id, result);
    return result;
  }

  return need(targetId);
}

/**
 * Schedule the needed courses into quarters, using Kahn's algorithm in layers:
 *   1. "ready" = needed courses whose prereqs are all done before this quarter.
 *   2. Take up to maxPerQuarter of them, longest remaining chain first
 *      (critical-path priority), so long chains don't delay graduation.
 *   3. Mark them done and repeat.
 * Courses in the same quarter never depend on each other.
 *
 * Returns { quarters: [[id, ...], ...], needed: Set }.
 */
function planQuarters(targetIds, byId, taken, maxPerQuarter) {
  if (maxPerQuarter < 1) throw new Error("maxPerQuarter must be at least 1");

  const needed = new Set();
  for (const t of targetIds) {
    for (const id of requiredFor(t, byId, taken)) needed.add(id);
  }

  // Critical path: longest chain of needed courses that start at this one.
  const height = new Map();
  function chain(id) {
    if (height.has(id)) return height.get(id);
    let h = 1;
    for (const other of needed) {
      const course = byId.get(other);
      if (course && prereqIds(course).includes(id)) h = Math.max(h, chain(other) + 1);
    }
    height.set(id, h);
    return h;
  }
  for (const id of needed) chain(id);

  const done = new Set(taken);
  const remaining = new Set(needed);
  const quarters = [];

  while (remaining.size > 0) {
    const ready = [...remaining]
      .filter(id => isAvailable(byId.get(id), done))
      .sort((a, b) => height.get(b) - height.get(a) || a.localeCompare(b));

    if (ready.length === 0) {
      throw new Error("No course can be scheduled: prerequisites form a cycle or are missing.");
    }

    const quarter = ready.slice(0, maxPerQuarter);
    for (const id of quarter) {
      remaining.delete(id);
      done.add(id);
    }
    quarters.push(quarter);
  }

  return { quarters, needed };
}
