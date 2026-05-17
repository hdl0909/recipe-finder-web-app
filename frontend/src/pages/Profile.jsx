import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Profile() {
  const [profile, setProfile] = useState({ age: '', weight: '', goal: 'maintenance', allergens: '' })
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  // Загрузка профиля и избранного
  useEffect(() => {
    const loadData = async () => {
      try {
        // Профиль
        const { data: profileData } = await client.get('/profile/')
        setProfile({
          age: profileData.age ?? '',
          weight: profileData.weight ?? '',
          goal: profileData.goal || 'maintenance',
          allergens: profileData.allergens || ''
        })
        
        // Избранное
        const { data: favData } = await client.get('/recipes/my_favorites/')
        setFavorites(favData)
      } catch (err) {
        const status = err.response?.status
        const detail = err.response?.data?.detail || 'Сервер недоступен'
        setMessage({ type: 'error', text: `Ошибка загрузки (${status}): ${detail}` })
        if (status === 401) navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [navigate])

  const handleChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const payload = {
        age: profile.age ? parseInt(profile.age) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        goal: profile.goal,
        allergens: profile.allergens
      }
      await client.put('/profile/', payload)
      setMessage({ type: 'success', text: 'Профиль успешно обновлён!' })
    } catch (err) {
      const detail = err.response?.data?.non_field_errors?.[0] || 
                     JSON.stringify(err.response?.data) || 'Неизвестная ошибка'
      setMessage({ type: 'error', text: `Ошибка сохранения: ${detail}` })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="profile-loading">Загрузка...</div>

  return (
    <div className="profile-page">
      <h2>Личный кабинет</h2>
      
      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}
      
      {/* Форма профиля */}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Возраст (лет)</label>
          <input
            type="number"
            name="age"
            value={profile.age}
            onChange={handleChange}
            min="1"
            max="120"
            placeholder="25"
          />
        </div>
        
        <div className="form-group">
          <label>Вес (кг)</label>
          <input
            type="number"
            name="weight"
            value={profile.weight}
            onChange={handleChange}
            min="30"
            max="300"
            step="0.1"
            placeholder="70.5"
          />
        </div>
        
        <div className="form-group">
          <label>Цель питания</label>
          <select name="goal" value={profile.goal} onChange={handleChange}>
            <option value="weight_loss">Похудение</option>
            <option value="maintenance">Поддержание веса</option>
            <option value="weight_gain">Набор массы</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Аллергены и непереносимые продукты</label>
          <textarea
            name="allergens"
            value={profile.allergens}
            onChange={handleChange}
            rows="3"
            placeholder="арахис, молоко, глютен"
          />
          <small>Перечислите через запятую. Рецепты с этими ингредиентами будут помечены.</small>
        </div>
        
        <button type="submit" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>

      {/* Блок избранного */}
      {favorites.length > 0 && (
        <section className="favorites-section">
          <h2>⭐ Избранное</h2>
          <div className="favorites-grid">
            {favorites.map(r => (
              <div 
                key={r.id} 
                className="card" 
                onClick={() => navigate(`/recipes/${r.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <h4>{r.title}</h4>
                <p className="author">Автор: {r.author}</p>
                <small>❤️ {r.likes_count || 0} | ⭐ {r.favorites_count || 0}</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}