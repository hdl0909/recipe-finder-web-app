import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  PieChart, Pie, Cell, Tooltip, Legend, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer 
} from 'recharts'
import client from '../api/client'

const COLORS = ['#4CAF50', '#FF9800', '#2196F3']

export default function FoodDiary() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState([])
  const [dailyStats, setDailyStats] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [macroData, setMacroData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Форма и поиск
  const [form, setForm] = useState({ meal_type: 'lunch', portion_size: 100, notes: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedItem, setSelectedItem] = useState(null) // { id, type, name }
  const [submitting, setSubmitting] = useState(false)

  // Загрузка данных
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [entriesRes, statsRes, weeklyRes, macroRes] = await Promise.all([
        client.get(`/diary/?date=${selectedDate}`),
        client.get(`/diary/daily_stats/?date=${selectedDate}`),
        client.get('/diary/weekly_chart_data/'),
        client.get('/diary/macro_distribution/')
      ])
      setEntries(entriesRes.data.results || entriesRes.data || [])
      setDailyStats(statsRes.data)
      setWeeklyData(weeklyRes.data.data || [])
      setMacroData(macroRes.data)
    } catch (err) {
      console.error('Ошибка загрузки дневника', err)
      if (err.response?.status === 401) navigate('/login')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, navigate])

  useEffect(() => { loadData() }, [loadData])

  // Поиск рецептов/продуктов
  const handleSearch = async (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.length < 2) { setSearchResults([]); return }

    try {
      const [recipesRes, productsRes] = await Promise.all([
        client.get(`/recipes/?search=${query}`),
        client.get(`/products/?search=${query}`)
      ])
      const rList = recipesRes.data.results || recipesRes.data || []
      const pList = productsRes.data.results || productsRes.data || []
      
      setSearchResults([
        ...rList.map(r => ({ id: r.id, type: 'recipe', name: r.title })),
        ...pList.map(p => ({ id: p.id, type: 'product', name: p.name }))
      ].slice(0, 10))
    } catch (err) {
      console.error('Ошибка поиска', err)
    }
  }

  // Выбор элемента из списка
  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setSearchQuery(item.name)
    setSearchResults([])
  }

  // Отправка формы
  const handleAddEntry = async (e) => {
    e.preventDefault()
    if (!selectedItem) {
      alert('Выберите рецепт или продукт из выпадающего списка')
      return
    }
    if (!form.portion_size || form.portion_size <= 0) {
      alert('Укажите корректный вес порции')
      return
    }

    setSubmitting(true)
    try {
      await client.post('/diary/', {
        recipe: selectedItem.type === 'recipe' ? selectedItem.id : null,
        product: selectedItem.type === 'product' ? selectedItem.id : null,
        meal_type: form.meal_type,
        date: selectedDate,
        portion_size: parseFloat(form.portion_size),
        notes: form.notes
      })
      
      // Сброс и обновление
      setSelectedItem(null)
      setSearchQuery('')
      setForm({ meal_type: 'lunch', portion_size: 100, notes: '' })
      await loadData()
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.join(', ') || 
                  err.response?.data?.detail || 
                  JSON.stringify(err.response?.data) || 
                  'Ошибка сервера'
      alert(`Не удалось добавить: ${msg}`)
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Удаление записи
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить запись?')) return
    try {
      await client.delete(`/diary/${id}/`)
      await loadData()
    } catch (err) {
      alert('Ошибка удаления')
    }
  }

  // Данные для круговой диаграммы
  const pieData = macroData ? [
    { name: 'Белки', value: macroData.calories_from_macros.proteins },
    { name: 'Жиры', value: macroData.calories_from_macros.fats },
    { name: 'Углеводы', value: macroData.calories_from_macros.carbs },
  ] : []

  if (loading) return <div className="loading">Загрузка дневника...</div>

  return (
    <div className="diary-page">
      <h2>Дневник питания</h2>
      
      <div className="date-picker">
        <label>Дата: 
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </label>
      </div>

      {dailyStats && (
        <div className="daily-summary">
          <h3>Итого за {dailyStats.date}</h3>
          <div className="stats-grid">
            <div className="stat-card">{dailyStats.totals.calories} ккал</div>
            <div className="stat-card">{dailyStats.totals.proteins}г Б</div>
            <div className="stat-card">{dailyStats.totals.fats}г Ж</div>
            <div className="stat-card">{dailyStats.totals.carbs}г У</div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-card">
          <h4>Распределение БЖУ (калории)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} ккал`, 'Калории']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Калории за неделю</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="calories" stroke="#4CAF50" name="Ккал" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="add-entry">
        <h3>➕ Добавить приём пищи</h3>
        <form onSubmit={handleAddEntry} className="diary-form">
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Поиск рецепта или продукта</label>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={handleSearch} 
              placeholder="Начните вводить название..." 
              autoComplete="off"
            />
            {searchResults.length > 0 && (
              <ul className="search-results">
                {searchResults.map(item => (
                  <li key={`${item.type}-${item.id}`} onClick={() => handleSelectItem(item)} className="search-item">
                    {item.type === 'recipe' ? '🍽️' : '🥦'} {item.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Тип приёма</label>
              <select value={form.meal_type} onChange={e => setForm({...form, meal_type: e.target.value})}>
                <option value="breakfast">Завтрак</option>
                <option value="lunch">Обед</option>
                <option value="dinner">Ужин</option>
                <option value="snack">Перекус</option>
              </select>
            </div>
            <div className="form-group">
              <label>Вес порции (г)</label>
              <input type="number" min="1" max="5000" value={form.portion_size} 
                     onChange={e => setForm({...form, portion_size: e.target.value})} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Заметки (опционально)</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} 
                      rows="2" placeholder="Например: без соли, домашний рецепт..." />
          </div>
          
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Сохранение...' : 'Добавить в дневник'}
          </button>
        </form>
      </section>

      <section className="entries-list">
        <h3>Записи за {selectedDate} ({entries.length})</h3>
        {entries.length === 0 ? (
          <p className="empty">Нет записей за этот день</p>
        ) : (
          <div className="entries-grid">
            {entries.map(entry => (
              <div key={entry.id} className="entry-card">
                <div className="entry-header">
                  <span className="entry-type">{entry.meal_type_display || entry.meal_type}</span>
                  <button className="btn-delete" onClick={() => handleDelete(entry.id)}>✕</button>
                </div>
                <h4>{entry.recipe_title || entry.product_name || 'Без названия'}</h4>
                <p className="entry-meta">Порция: {entry.portion_size}г</p>
                <div className="entry-kbju">
                  <span>🔥 {entry.calories}ккал</span>
                  <span>Б:{entry.proteins}г</span>
                  <span>Ж:{entry.fats}г</span>
                  <span>У:{entry.carbs}г</span>
                </div>
                {entry.notes && <p className="entry-notes">"{entry.notes}"</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}