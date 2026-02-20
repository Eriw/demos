'use client';

import { useState, useCallback, useEffect } from 'react';
import { PUZZLES, getPuzzleWithClues } from './puzzles';

// Cell states
const EMPTY = 0;
const FILLED = 1;
const MARKED = 2; // X marker (definitely empty)

function makeGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(EMPTY));
}

function checkWin(grid, solution) {
  return solution.every((row, r) =>
    row.every((cell, c) => (cell === 1) === (grid[r][c] === FILLED))
  );
}

function getRowErrors(grid, rowClues) {
  return rowClues.map((clue, r) => {
    const actual = computeActualClue(grid[r].map((c) => (c === FILLED ? 1 : 0)));
    return !arraysEqual(actual, clue);
  });
}

function getColErrors(grid, colClues, size) {
  return colClues.map((clue, c) => {
    const col = grid.map((row) => (row[c] === FILLED ? 1 : 0));
    const actual = computeActualClue(col);
    return !arraysEqual(actual, clue);
  });
}

function computeActualClue(line) {
  const clues = [];
  let count = 0;
  for (const cell of line) {
    if (cell === 1) count++;
    else if (count > 0) { clues.push(count); count = 0; }
  }
  if (count > 0) clues.push(count);
  return clues.length === 0 ? [0] : clues;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function NonogramGame() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzle, setPuzzle] = useState(() => getPuzzleWithClues(PUZZLES[0]));
  const [grid, setGrid] = useState(() => makeGrid(PUZZLES[0].size));
  const [won, setWon] = useState(false);
  const [dragMode, setDragMode] = useState(null); // FILLED or MARKED or EMPTY (for drag-fill)
  const [showErrors, setShowErrors] = useState(false);
  const [rowErrors, setRowErrors] = useState([]);
  const [colErrors, setColErrors] = useState([]);

  const loadPuzzle = useCallback((idx) => {
    const p = getPuzzleWithClues(PUZZLES[idx]);
    setPuzzle(p);
    setGrid(makeGrid(p.size));
    setWon(false);
    setShowErrors(false);
    setRowErrors([]);
    setColErrors([]);
    setPuzzleIndex(idx);
  }, []);

  const cycleCell = useCallback((r, c, grid) => {
    // left click: EMPTY -> FILLED -> EMPTY
    const cur = grid[r][c];
    return cur === FILLED ? EMPTY : FILLED;
  }, []);

  const markCell = useCallback((r, c, grid) => {
    // right click: EMPTY -> MARKED -> EMPTY
    const cur = grid[r][c];
    return cur === MARKED ? EMPTY : MARKED;
  }, []);

  const applyCell = useCallback(
    (r, c, newState, currentGrid) => {
      const newGrid = currentGrid.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? newState : cell))
      );
      if (checkWin(newGrid, puzzle.solution)) {
        setWon(true);
      }
      return newGrid;
    },
    [puzzle]
  );

  const handleMouseDown = useCallback(
    (e, r, c) => {
      e.preventDefault();
      setGrid((prev) => {
        let newState;
        if (e.button === 2) {
          newState = markCell(r, c, prev);
        } else {
          newState = cycleCell(r, c, prev);
        }
        setDragMode(newState);
        return applyCell(r, c, newState, prev);
      });
    },
    [cycleCell, markCell, applyCell]
  );

  const handleMouseEnter = useCallback(
    (e, r, c) => {
      if (dragMode === null) return;
      if (!(e.buttons === 1 || e.buttons === 2)) {
        setDragMode(null);
        return;
      }
      setGrid((prev) => applyCell(r, c, dragMode, prev));
    },
    [dragMode, applyCell]
  );

  const handleMouseUp = useCallback(() => {
    setDragMode(null);
  }, []);

  const handleCheck = useCallback(() => {
    setRowErrors(getRowErrors(grid, puzzle.rowClues));
    setColErrors(getColErrors(grid, puzzle.colClues, puzzle.size));
    setShowErrors(true);
  }, [grid, puzzle]);

  const handleReset = useCallback(() => {
    setGrid(makeGrid(puzzle.size));
    setWon(false);
    setShowErrors(false);
    setRowErrors([]);
    setColErrors([]);
  }, [puzzle]);

  useEffect(() => {
    const up = () => setDragMode(null);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const maxRowClueLen = Math.max(...puzzle.rowClues.map((c) => c.length));
  const maxColClueLen = Math.max(...puzzle.colClues.map((c) => c.length));

  return (
    <div className="game-wrap" onMouseUp={handleMouseUp}>
      <div className="puzzle-picker">
        {PUZZLES.map((p, i) => (
          <button
            key={p.id}
            className={`pick-btn ${i === puzzleIndex ? 'active' : ''}`}
            onClick={() => loadPuzzle(i)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {won && (
        <div className="win-banner">
          Puzzle solved! 🎉
        </div>
      )}

      <div
        className="nonogram"
        onContextMenu={(e) => e.preventDefault()}
        style={{ '--size': puzzle.size, '--max-col-clue': maxColClueLen }}
      >
        {/* Column clues header */}
        <div className="col-clues-row">
          {/* spacer for row-clue column */}
          <div className="row-clue-spacer" style={{ gridRow: `span ${maxColClueLen}` }} />
          {puzzle.colClues.map((clue, c) => (
            <div
              key={c}
              className={`col-clue ${showErrors && colErrors[c] ? 'error' : ''}`}
            >
              {clue.map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {grid.map((row, r) => (
          <div key={r} className="grid-row">
            <div className={`row-clue ${showErrors && rowErrors[r] ? 'error' : ''}`}>
              {puzzle.rowClues[r].map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </div>
            {row.map((cell, c) => (
              <div
                key={c}
                className={`cell ${cell === FILLED ? 'filled' : ''} ${cell === MARKED ? 'marked' : ''} ${(c + 1) % 5 === 0 && c + 1 < puzzle.size ? 'border-right-thick' : ''} ${(r + 1) % 5 === 0 && r + 1 < puzzle.size ? 'border-bottom-thick' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, r, c)}
                onMouseEnter={(e) => handleMouseEnter(e, r, c)}
              >
                {cell === MARKED && <span className="x-mark">✕</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="controls">
        <button className="ctrl-btn" onClick={handleCheck} disabled={won}>
          Check
        </button>
        <button className="ctrl-btn reset" onClick={handleReset}>
          Reset
        </button>
      </div>

      <p className="hint">Left-click to fill · Right-click to mark empty · Drag to paint</p>
    </div>
  );
}
