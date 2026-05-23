import { useState, useEffect } from 'react'
import client from '../api/client'

export default function Profile() {
  const [profile, setProfile] = useState({ allergens: '' })
  const [pantry, setPantry] = useState([])
  const [newProduct, setNewProduct] = useState('')
  const [newQty, setNewQty] = useState(100)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  // Загрузка данных профиля и холодильника
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profRes, pantryRes] = await Promise.all([
          client.get('/profile/'),
          client.get('/pantry/')
        ])
        setProfile(profRes.data)
        setPantry(pantryRes.data.results || pantryRes.data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  // Сохранение аллергенов
  const saveProfile = async () => {
    try {
      await client.put('/profile/', profile)
      alert('Профиль сохранен')
    } catch (err) { alert('Ошибка сохранения') }
  }

  // Поиск продукта для добавления в холодильник
  const handleSearchProduct = async (e) => {
    const val = e.target.value
    setNewProduct(val)
    if (val.length < 2) { setSuggestions([]); return }
    try {
      const res = await client.get(`/products/?search=${val}`)
      setSuggestions(res.data.results || res.data || [])
    } catch {}
  }

  // Добавление в холодильник
  const addToPantry = async (prod) => {
    try {
      await client.post('/pantry/', { product_id: prod.id, quantity: newQty })
      // Оптимистичное обновление списка
      setPantry(prev => [...prev, { id: Date.now(), product_name: prod.name, quantity: newQty }])
      setNewProduct('')
      setSuggestions([])
    } catch (err) { alert('Ошибка добавления') }
  }

  // Удаление из холодильника
  const removeFromPantry = async (id) => {
    try {
      await client.delete(`/pantry/${id}/`)
      setPantry(prev => prev.filter(item => item.id !== id))
    } catch {}
  }

  if (loading) return <div className="loading">Загрузка...</div>

  return (
    <div className="profile-page">
      <h2>Профиль и настройки</h2>
      
      {/* Секция Аллергенов */}
      <section className="profile-section">
        <h3>Аллергены и ограничения</h3>
        <p className="hint">Введите продукты через запятую (например: орехи, молоко, глютен)</p>
        <textarea 
          value={profile.allergens || ''} 
          onChange={e => setProfile({...profile, allergens: e.target.value})}
          rows="3"
          placeholder="Список аллергенов..."
        />
        <button className="btn-primary" onClick={saveProfile}>Сохранить профиль</button>
      </section>

      {/* Секция Холодильника */}
      <section className="profile-section">
        <h3>Мой холодильник</h3>
        <p className="hint">Добавьте продукты, которые у вас есть дома, чтобы видеть недостающие ингредиенты в рецептах.</p>
        
        <div className="add-pantry-form">
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              placeholder="Найти продукт..." 
              value={newProduct} 
              onChange={handleSearchProduct} 
            />
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map(p => (
                  <li key={p.id} onMouseDown={() => addToPantry(p)}>{p.name}</li>
                ))}
              </ul>
            )}
          </div>
          <input 
            type="number" 
            placeholder="Граммы" 
            value={newQty} 
            onChange={e => setNewQty(e.target.value)} 
            style={{ width: '100px' }}
          />
          <button className="btn-secondary" disabled={!newProduct}>Добавить</button>
        </div>

        <div className="pantry-list">
          {pantry.length === 0 ? <p>Холодильник пуст</p> : (
            <ul>
              {pantry.map(item => (
                <li key={item.id}>
                  <span>{item.product_name} -- <b>{item.quantity} г.</b></span>
                  <button className="btn-delete" onClick={() => removeFromPantry(item.id)}>x</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}