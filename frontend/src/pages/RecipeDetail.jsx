import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../api/client'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recipeRes, commentsRes] = await Promise.all([
          client.get(`/recipes/${id}/`),
          client.get(`/comments/?recipe=${id}`)
        ])
        setRecipe(recipeRes.data)
        setComments(commentsRes.data.results || commentsRes.data)
      } catch (err) {
        console.error(err)
        navigate('/')
      }
    }
    loadData()
  }, [id, navigate])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setCommentLoading(true)
    try {
      const { data } = await client.post('/comments/', { recipe: id, text: newComment })
      setComments(prev => [data, ...prev])
      setNewComment('')
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      console.error('Ошибка комментария', err)
    } finally {
      setCommentLoading(false)
    }
  }

  if (!recipe) return <div className="loading">Загрузка...</div>

  return (
    <div className="recipe-detail">
      <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>
      
      <h1>{recipe.title}</h1>
      
      {/* Предупреждение об аллергенах */}
      {recipe.has_allergens && (
        <div className="allergen-alert">
          <span className="alert-icon">🚨</span>
          <div>
            <strong>Внимание: рецепт содержит аллергены!</strong>
            <p>В составе обнаружены: {recipe.matched_allergens?.join(', ') || 'указанные в профиле'}</p>
          </div>
        </div>
      )}

      <p className="meta">Автор: {recipe.author} | ❤️ {recipe.likes_count} | ⭐ {recipe.favorites_count}</p>
      <p className="desc">{recipe.description}</p>
      
      <div className="kbju-block">
        Ккал: {recipe.total_calories} | Б: {recipe.total_proteins}г | Ж: {recipe.total_fats}г | У: {recipe.total_carbs}г
      </div>

      {/* Ингредиенты */}
      <h3>Ингредиенты</h3>
      <ul className="ing-list">
        {recipe.ingredients.map(i => (
          <li key={i.product}>{i.product_name} — <b>{i.weight_g} г.</b></li>
        ))}
      </ul>

      {/* Блок недостающих продуктов (Кладовая) */}
      {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
        <div className="missing-block">
          <h3>Нужно докупить:</h3>
          <ul className="missing-list">
            {recipe.missing_ingredients.map((ing, idx) => (
              <li key={idx}>
                {ing.name} <span className="weight-badge">{ing.needed_weight} г.</span>
              </li>
            ))}
          </ul>
          <p className="hint-text">
            Этих продуктов нет в вашем <Link to="/profile">холодильнике</Link>.
          </p>
        </div>
      )}

      {/* Комментарии */}
      <section className="comments-section">
        <h3>Комментарии ({comments.length})</h3>
        <form onSubmit={handleAddComment} className="comment-form">
          <textarea 
            value={newComment} 
            onChange={e => setNewComment(e.target.value)} 
            placeholder="Оставьте комментарий..." 
            maxLength={1000}
            required 
          />
          <button type="submit" disabled={commentLoading}>
            {commentLoading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
        <div className="comments-list">
          {comments.map(c => (
            <div key={c.id} className="comment-card">
              <div className="comment-header">
                <span className="comment-author">{c.author}</span>
                <span className="comment-date">{new Date(c.created_at).toLocaleString('ru-RU')}</span>
              </div>
              <p className="comment-text">{c.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}