import Link from 'next/link';
import { recipes } from '../lib/recipes';

export default function Home() {
  return (
    <main className="container">
      <div className="home-header">
        <h1>Receptbok</h1>
        <p>Välj ett recept för att komma igång.</p>
      </div>
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipe/${recipe.id}`} className="recipe-card">
            <span className="recipe-card-emoji">{recipe.emoji}</span>
            <div className="recipe-card-info">
              <h2>{recipe.name}</h2>
              <span>{recipe.yield}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
