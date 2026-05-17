import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')

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
            <div key={r.id} className="card">
                <h3>{r.title}</h3>
                <p className="author">Автор: {r.author}</p>
                <p>Ккал: {r.total_calories} | Б: {r.total_proteins} г. | Ж: {r.total_fats} г. | У: {r.total_carbs} г.</p>
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