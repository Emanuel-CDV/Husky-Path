# Husky Path

**Live demo:** https://emanuel-cdv.github.io/Husky-Path/

A course planner for UW CSE students. Mark the courses you've taken or are taking now. Husky Path shows what you can take next and builds a quarter-by-quarter path to any course.

I built it to plan my own path through the UW CSE curriculum.

## Features
- **Course status**: each of 36 courses shows as Taken, In progress, Available now, or Locked (with the missing prereqs listed, e.g. "Needs CSE 333").
- **Path planner**: pick a target course and a maximum number of courses per quarter. You get a valid schedule that starts next quarter.
- **Prerequisite map**: an SVG graph of the whole curriculum. Hover over a course to highlight its full prerequisite chain.
- Works on phones, supports dark mode, and saves your progress in the browser.

## How it works
The curriculum is a **directed acyclic graph** (an edge A → B means A is a prereq of B). All the graph logic is in [`graph.js`](graph.js) as pure, tested functions:

| Problem | Approach |
|---|---|
| "Either/or" prereqs, like CSE 123 **or** CSE 143 | Prereqs are stored in conjunctive normal form: a list of clauses that must all be met, each met by any one of its options |
| Checking the data is valid | Three-color DFS cycle detection |
| What's left to reach a course | A recursive search over prereqs. For an OR it greedily picks the option that needs the fewest extra courses |
| Scheduling into quarters | **Kahn's topological sort, processed in layers**. Each quarter takes the courses whose prereqs are all done, up to a limit, and longer remaining chains go first (critical-path priority) |
| Graph layout | Longest path in a DAG (memoized DFS) decides each course's column |

Plain HTML, CSS, and JavaScript, with no frameworks and no build step.

## Tests
Open [`tests.html`](tests.html) in a browser. There are 14 tests, including one that plans a path to **every** course at **every** per-quarter limit and checks that no course is ever scheduled before its prereqs.

## Run locally
Open `index.html` in any browser.

## What's next
- Pull real prereqs and quarterly offerings from the UW course catalog instead of a hand-entered list
- Plan toward several targets at once (e.g. a full specialization)
- Credit limits per quarter instead of course counts

*Prerequisites are simplified. Always check the official UW course catalog and talk to your adviser.*
