// Each puzzle: solution is a 2D array (1 = filled, 0 = empty)
export const PUZZLES = [
  {
    id: 0,
    name: 'Heart',
    size: 5,
    solution: [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: 1,
    name: 'Arrow',
    size: 5,
    solution: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: 2,
    name: 'Checkerboard',
    size: 5,
    solution: [
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1],
    ],
  },
  {
    id: 3,
    name: 'House',
    size: 7,
    solution: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    id: 4,
    name: 'Diamond',
    size: 7,
    solution: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
    ],
  },
];

// Compute clues from a solution row/column array
function computeClue(line) {
  const clues = [];
  let count = 0;
  for (const cell of line) {
    if (cell === 1) {
      count++;
    } else if (count > 0) {
      clues.push(count);
      count = 0;
    }
  }
  if (count > 0) clues.push(count);
  return clues.length === 0 ? [0] : clues;
}

export function getPuzzleWithClues(puzzle) {
  const n = puzzle.size;
  const rowClues = puzzle.solution.map((row) => computeClue(row));
  const colClues = Array.from({ length: n }, (_, c) =>
    computeClue(puzzle.solution.map((row) => row[c]))
  );
  return { ...puzzle, rowClues, colClues };
}
