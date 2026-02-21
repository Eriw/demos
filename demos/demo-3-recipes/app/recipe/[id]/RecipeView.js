'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

function CheckItem({ label, prefix, checked, onToggle }) {
  return (
    <li>
      <button
        type="button"
        className={`checklist-item${checked ? ' checked' : ''}`}
        onClick={onToggle}
        aria-pressed={checked}
      >
        <span className="check-circle">
          <span className="checkmark">✓</span>
        </span>
        {prefix && <span className="step-number">{prefix}</span>}
        <span className="item-text">{label}</span>
      </button>
    </li>
  );
}

export default function RecipeView({ recipe }) {
  // Build a flat list of all checkable items keyed by "sectionIdx-type-itemIdx"
  const allKeys = useMemo(() => {
    const keys = [];
    recipe.sections.forEach((section, si) => {
      section.ingredients.forEach((_, ii) => keys.push(`${si}-ing-${ii}`));
      section.steps.forEach((_, si2) => keys.push(`${si}-step-${si2}`));
    });
    return keys;
  }, [recipe]);

  const [checked, setChecked] = useState(() => new Set());

  function toggle(key) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function reset() {
    setChecked(new Set());
  }

  const total = allKeys.length;
  const done = allKeys.filter((k) => checked.has(k)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <main className="container">
      <Link href="/" className="back-link">
        ← Alla recept
      </Link>

      <div className="recipe-hero">
        <span className="recipe-hero-emoji">{recipe.emoji}</span>
        <h1>{recipe.name}</h1>
        {recipe.yield && <p className="recipe-yield">{recipe.yield}</p>}
      </div>

      <p className="progress-label">{done} / {total} avklarade</p>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {recipe.sections.map((section, si) => (
        <div key={si}>
          {/* ── Ingredients ── */}
          <div className="recipe-section">
            <h2 className="section-title">
              {section.name ? `${section.name} – Ingredienser` : 'Ingredienser'}
            </h2>
            <ul className="checklist">
              {section.ingredients.map((ing, ii) => {
                const key = `${si}-ing-${ii}`;
                return (
                  <CheckItem
                    key={key}
                    label={ing}
                    prefix={null}
                    checked={checked.has(key)}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </ul>
          </div>

          {/* ── Steps ── */}
          <div className="recipe-section">
            <h2 className="section-title">
              {section.name ? `${section.name} – Gör så här` : 'Gör så här'}
            </h2>
            <ul className="checklist">
              {section.steps.map((step, si2) => {
                const key = `${si}-step-${si2}`;
                return (
                  <CheckItem
                    key={key}
                    label={step}
                    prefix={`${si2 + 1}`}
                    checked={checked.has(key)}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </ul>
          </div>
        </div>
      ))}

      {done > 0 && (
        <button type="button" className="reset-btn" onClick={reset}>
          Återställ alla
        </button>
      )}
    </main>
  );
}
