import { useState } from 'react'
import axios from 'axios'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post('/api/auth/token/', {
        username,
        password,
      })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      window.location.href = '/'
    } catch {
      setError('Неверный логин или пароль')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Вход</h2>
      {error && <p className="error">{error}</p>}
      <input placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} required />
      <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Войти</button>
      <p style={{textAlign: 'center', marginTop: '10px'}}>
      Нет аккаунта? <a href="/register">Зарегистрироваться</a>
      </p>
    </form>
  )
}