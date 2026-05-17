import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const fetchRecipes = async () => {
    try {
      const { data } = await client.get(`/recipes/?ingredients=${search}`)
      setRecipes(data)
    } catch (err) {
      console.error('Ошибка загрузки рецептов', err)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [search])

  const toggleAction = async (id, action) => {
    try {
      await client.post(`/recipes/${id}/${action}/`)
      fetchRecipes()
    } catch (err) {
      console.error(`Ошибка ${action}`, err)
    }
  }

  return (
    <div className="recipes-page">
      <h2>Рецепты</h2>
      <input
        placeholder="Поиск по ингредиентам (через запятую)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="grid">
        {recipes.map(r => (
          <div 
            key={r.id} 
            className="card" 
            onClick={() => navigate(`/recipes/${r.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{r.title}</h3>
            
            {/* Кнопки действий — не вызывают переход */}
            <div className="card-actions" onClick={e => e.stopPropagation()}>
              <span className="action-btn" onClick={() => toggleAction(r.id, 'toggle_like')}>
                {r.is_liked ? '❤️' : '🤍'} {r.likes_count || 0}
              </span>
              <span className="action-btn" onClick={() => toggleAction(r.id, 'toggle_favorite')}>
                {r.is_favorited ? '⭐' : '☆'} {r.favorites_count || 0}
              </span>
            </div>

            <p className="author">Автор: {r.author}</p>
            <p>Ккал: {r.total_calories} | Б: {r.total_proteins}г | Ж: {r.total_fats}г | У: {r.total_carbs}г</p>
            
            <details>
              <summary>Ингредиенты</summary>
              <ul>
                {r.ingredients.map(i => (
                  <li key={i.product}>{i.product_name || 'Без названия'} ({i.weight_g} г.)</li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  )
}