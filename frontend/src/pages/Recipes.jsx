import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Recipes() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [titleQuery, setTitleQuery] = useState('')
  const [ingredientInput, setIngredientInput] = useState('')
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Загрузка рецептов
  const fetchRecipes = async (title, ingredients) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (title.trim()) params.set('title', title.trim())
      if (ingredients.length > 0) params.set('ingredients', ingredients.join(','))
      
      const { data } = await client.get(`/recipes/?${params.toString()}`)
      setRecipes(data.results || data || [])
    } catch (err) {
      console.error('Ошибка загрузки рецептов', err)
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecipes('', []) }, [])

  // Поиск подсказок
  const handleIngredientInput = async (e) => {
    const val = e.target.value
    setIngredientInput(val)
    setShowDropdown(true)
    
    if (val.length < 2) { setSuggestions([]); return }
    try {
      const res = await client.get(`/products/?search=${val}`)
      setSuggestions(res.data.results || res.data || [])
    } catch { setSuggestions([]) }
  }

  // Выбор продукта
  const selectIngredient = (prod) => {
    if (!selectedIngredients.includes(prod.name)) {
      setSelectedIngredients(prev => [...prev, prod.name])
    }
    setIngredientInput('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  // Закрытие списка при потере фокуса
  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150)
  }

  const handleSearch = () => fetchRecipes(titleQuery, selectedIngredients)
  const handleReset = () => {
    setTitleQuery('')
    setSelectedIngredients([])
    setIngredientInput('')
    setSuggestions([])
    setShowDropdown(false)
    fetchRecipes('', [])
  }

  // Лайки/избранное
  const toggleAction = async (id, action) => {
    try {
      await client.post(`/recipes/${id}/${action}/`)
      fetchRecipes(titleQuery, selectedIngredients)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="recipes-page">
      <h2>📖 Рецепты</h2>
      
      <div className="search-panel">
        <div className="search-row">
          <div className="search-group">
            <label>По названию</label>
            <input 
              placeholder="Например: Борщ, Паста..." 
              value={titleQuery} 
              onChange={e => setTitleQuery(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="search-group" style={{ position: 'relative' }}>
            <label>По ингредиентам</label>
            <input 
              ref={inputRef}
              placeholder="Начните вводить (курица, рис...)" 
              value={ingredientInput} 
              onChange={handleIngredientInput}
              onBlur={handleBlur}
              onKeyDown={e => e.key === 'Enter' && suggestions.length > 0 && selectIngredient(suggestions[0])}
            />
            {showDropdown && suggestions.length > 0 && (
              <ul className="suggestions-list" onMouseDown={e => e.preventDefault()}>
                {suggestions.map(p => (
                  <li key={p.id} onMouseDown={() => selectIngredient(p)}>{p.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {selectedIngredients.length > 0 && (
          <div className="tags-container">
            {selectedIngredients.map(ing => (
              <span key={ing} className="tag">
                {ing} <button type="button" onClick={() => setSelectedIngredients(prev => prev.filter(i => i !== ing))}>✕</button>
              </span>
            ))}
          </div>
        )}

        <div className="search-buttons">
          <button className="btn-search" onClick={handleSearch} disabled={loading}>
            {loading ? 'Поиск...' : '🔍 Найти'}
          </button>
          <button className="btn-reset" onClick={handleReset}>Сбросить</button>
        </div>
      </div>

      <div className="grid">
        {loading ? (
          <p className="empty-state">Загрузка...</p>
        ) : recipes.length === 0 ? (
          <p className="empty-state">Рецепты не найдены. Попробуйте изменить фильтры.</p>
        ) : (
          recipes.map(r => (
            <div key={r.id} className="card" onClick={() => navigate(`/recipes/${r.id}`)}>
              <h3 className="recipe-title">
                {r.title}
                {r.has_allergens && (
                  <span className="allergen-badge" title={`Содержит: ${r.matched_allergens?.join(', ')}`}>
                    ⚠️ Аллерген
                  </span>
                )}
              </h3>
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
          ))
        )}
      </div>
    </div>
  )
}