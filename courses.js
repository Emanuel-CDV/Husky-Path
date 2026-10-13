// Course data for Husky Path.
//
// Prerequisites are stored as an AND of ORs (conjunctive normal form):
//   prereqs: [["CSE 123", "CSE 143"], ["MATH 126"]]
// means "(CSE 123 OR CSE 143) AND MATH 126".
//
// NOTE: prerequisites are simplified for planning purposes.
// Always confirm with the official UW course catalog / your adviser.

const INTRO = ["CSE 123", "CSE 143"]; // either intro sequence counts

const COURSES = [
  // Intro programming (two equivalent tracks)
  { id: "CSE 121", title: "Intro to Computer Programming I", credits: 4, prereqs: [] },
  { id: "CSE 122", title: "Intro to Computer Programming II", credits: 4, prereqs: [["CSE 121"]] },
  { id: "CSE 123", title: "Intro to Computer Programming III", credits: 4, prereqs: [["CSE 122"]] },
  { id: "CSE 142", title: "Computer Programming I", credits: 4, prereqs: [] },
  { id: "CSE 143", title: "Computer Programming II", credits: 5, prereqs: [["CSE 142"]] },

  // Math
  { id: "MATH 124", title: "Calculus I", credits: 5, prereqs: [] },
  { id: "MATH 125", title: "Calculus II", credits: 5, prereqs: [["MATH 124"]] },
  { id: "MATH 126", title: "Calculus III", credits: 5, prereqs: [["MATH 125"]] },
  { id: "MATH 208", title: "Matrix Algebra", credits: 3, prereqs: [["MATH 125"]] },

  // CSE core
  { id: "CSE 311", title: "Foundations of Computing I", credits: 4, prereqs: [INTRO, ["MATH 126"]] },
  { id: "CSE 312", title: "Foundations of Computing II", credits: 4, prereqs: [["CSE 311"]] },
  { id: "CSE 331", title: "Software Design & Implementation", credits: 4, prereqs: [INTRO, ["CSE 311"]] },
  { id: "CSE 332", title: "Data Structures & Parallelism", credits: 4, prereqs: [INTRO, ["CSE 311"]] },
  { id: "CSE 351", title: "The Hardware/Software Interface", credits: 4, prereqs: [INTRO] },
  { id: "CSE 333", title: "Systems Programming", credits: 4, prereqs: [["CSE 351"]] },

  // 300-level electives
  { id: "CSE 340", title: "Interaction Programming", credits: 4, prereqs: [INTRO] },
  { id: "CSE 341", title: "Programming Languages", credits: 4, prereqs: [INTRO] },
  { id: "CSE 344", title: "Intro to Data Management", credits: 4, prereqs: [["CSE 311"]] },
  { id: "CSE 369", title: "Intro to Digital Design", credits: 3, prereqs: [["CSE 351"]] },
  { id: "CSE 414", title: "Intro to Database Systems", credits: 4, prereqs: [INTRO] },

  // 400-level
  { id: "CSE 401", title: "Compiler Construction", credits: 4, prereqs: [["CSE 332"], ["CSE 351"]] },
  { id: "CSE 403", title: "Software Engineering", credits: 4, prereqs: [["CSE 331"]] },
  { id: "CSE 421", title: "Intro to Algorithms", credits: 3, prereqs: [["CSE 312"], ["CSE 332"]] },
  { id: "CSE 440", title: "Intro to HCI", credits: 5, prereqs: [["CSE 340"]] },
  { id: "CSE 444", title: "Database Systems Internals", credits: 4, prereqs: [["CSE 332"], ["CSE 344", "CSE 414"]] },
  { id: "CSE 446", title: "Machine Learning", credits: 4, prereqs: [["CSE 312"], ["CSE 332"], ["MATH 208"]] },
  { id: "CSE 447", title: "Natural Language Processing", credits: 4, prereqs: [["CSE 312"], ["CSE 332"]] },
  { id: "CSE 451", title: "Operating Systems", credits: 4, prereqs: [["CSE 332"], ["CSE 333"]] },
  { id: "CSE 452", title: "Distributed Systems", credits: 4, prereqs: [["CSE 332"], ["CSE 333"]] },
  { id: "CSE 455", title: "Computer Vision", credits: 4, prereqs: [["CSE 332"], ["MATH 208"]] },
  { id: "CSE 457", title: "Computer Graphics", credits: 4, prereqs: [["CSE 332"], ["MATH 208"]] },
  { id: "CSE 461", title: "Computer Networks", credits: 4, prereqs: [["CSE 332"], ["CSE 333"]] },
  { id: "CSE 469", title: "Computer Architecture I", credits: 5, prereqs: [["CSE 351"], ["CSE 369"]] },
  { id: "CSE 473", title: "Artificial Intelligence", credits: 3, prereqs: [["CSE 312"], ["CSE 332"]] },
  { id: "CSE 474", title: "Embedded Systems", credits: 4, prereqs: [["CSE 369"]] },
  { id: "CSE 484", title: "Computer Security", credits: 4, prereqs: [["CSE 332"], ["CSE 351"]] },
];
