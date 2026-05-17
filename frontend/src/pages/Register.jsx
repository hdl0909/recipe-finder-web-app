import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await axios.post('/api/auth/register/', form)
      navigate('/login')
    } catch (err) {
      setErrors(err.response?.data || { non_field: 'Ошибка соединения' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Регистрация</h2>
      {errors.non_field && <p className="error">{errors.non_field}</p>}
      <input name="username" placeholder="Логин" value={form.username} onChange={handleChange} required />
      {errors.username && <p className="error">{errors.username[0]}</p>}
      
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      {errors.email && <p className="error">{errors.email[0]}</p>}
      
      <input name="password" type="password" placeholder="Пароль (мин. 8 символов)" value={form.password} onChange={handleChange} required />
      {errors.password && <p className="error">{errors.password[0]}</p>}
      
      <button type="submit">Создать аккаунт</button>
    </form>
  )
}