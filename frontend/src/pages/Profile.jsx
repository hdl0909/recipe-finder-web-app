import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Profile() {
  const [profile, setProfile] = useState({ age: '', weight: '', goal: 'maintenance', allergens: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await client.get('/profile/')
        setProfile({
          age: data.age ?? '',
          weight: data.weight ?? '',
          goal: data.goal || 'maintenance',
          allergens: data.allergens || ''
        })
      } catch (err) {
        const status = err.response?.status
        const detail = err.response?.data?.detail || 'Сервер недоступен'
        setMessage({ type: 'error', text: `Ошибка загрузки профиля (${status}): ${detail}` })
        if (status === 401) navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [navigate])

  const handleChange = (e) => setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }))

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
      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group"><label>Возраст</label><input type="number" name="age" value={profile.age} onChange={handleChange} min="1" max="120" /></div>
        <div className="form-group"><label>Вес (кг)</label><input type="number" name="weight" value={profile.weight} onChange={handleChange} min="30" max="300" step="0.1" /></div>
        <div className="form-group"><label>Цель</label>
          <select name="goal" value={profile.goal} onChange={handleChange}>
            <option value="weight_loss">Похудение</option>
            <option value="maintenance">Поддержание</option>
            <option value="weight_gain">Набор массы</option>
          </select>
        </div>
        <div className="form-group"><label>Аллергены</label><textarea name="allergens" value={profile.allergens} onChange={handleChange} rows="3" placeholder="арахис, молоко" /></div>
        <button type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
      </form>
    </div>
  )
}