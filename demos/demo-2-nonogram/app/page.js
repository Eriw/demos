import NonogramGame from './NonogramGame';

export default function Home() {
  return (
    <main className="container">
      <h1>Nonogram</h1>
      <p className="subtitle">Fill the grid using the row &amp; column clues.</p>
      <NonogramGame />
    </main>
  );
}
