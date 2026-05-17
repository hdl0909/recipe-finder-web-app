import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)

  useEffect(() => {
    client.get(`/recipes/${id}/`).then(res => setRecipe(res.data)).catch(() => navigate('/'))
  }, [id])

  if (!recipe) return <div className="loading">Загрузка...</div>

  return (
    <div className="recipe-detail">
      <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>
      <h1>{recipe.title}</h1>
      <p className="meta">Автор: {recipe.author} | ❤️ {recipe.likes_count} | ⭐ {recipe.favorites_count}</p>
      <p className="desc">{recipe.description}</p>
      
      <div className="kbju-block">
        Ккал: {recipe.total_calories} | Б: {recipe.total_proteins}г | Ж: {recipe.total_fats}г | У: {recipe.total_carbs}г
      </div>

      <h3>Ингредиенты</h3>
      <ul className="ing-list">
        {recipe.ingredients.map(i => (
          <li key={i.product}>{i.product_name} — <b>{i.weight_g} г.</b></li>
        ))}
      </ul>
    </div>
  )
}