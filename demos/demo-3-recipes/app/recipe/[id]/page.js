import { notFound } from 'next/navigation';
import { getRecipe, recipes } from '../../../lib/recipes';
import RecipeView from './RecipeView';

export function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export function generateMetadata({ params }) {
  const recipe = getRecipe(params.id);
  return { title: recipe ? recipe.name : 'Recept' };
}

export default function RecipePage({ params }) {
  const recipe = getRecipe(params.id);
  if (!recipe) notFound();
  return <RecipeView recipe={recipe} />;
}
