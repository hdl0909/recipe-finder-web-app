import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Recipes from './pages/Recipes'
import CreateRecipe from './pages/CreateRecipe'
import Profile from './pages/Profile'
import RecipeDetail from './pages/RecipeDetail'
import FoodDiary from './pages/FoodDiary'
import client from './api/client' // Импортируем наш настроенный клиент
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true) // Блокировка показа до проверки

  // Проверка авторизации при загрузке
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setIsAuthenticated(false)
        setIsChecking(false)
        return
      }

      try {
        // Пробуем сделать легкий запрос к профилю. Если токен битый — клиент сам его удалит (см. interceptor)
        await client.get('/profile/') 
        setIsAuthenticated(true)
      } catch (err) {
        // Если ошибка 401, интерсептор в client.js уже удалил токен
        setIsAuthenticated(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuthStatus()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsAuthenticated(false)
    window.location.href = '/'
  }

  // Пока идет проверка, показываем загрузку, чтобы не мигало
  if (isChecking) {
    return <div className="loading-screen">Загрузка приложения...</div>
  }

  return (
    <Router>
      <div className="app-layout">
        <nav className="navbar">
          <Link to="/" className="nav-link">Рецепты</Link>
          {isAuthenticated ? (
            <>
              <Link to="/create" className="nav-link">Создать</Link>
              <Link to="/diary" className="nav-link">Дневник</Link>
              <Link to="/profile" className="nav-link">Профиль</Link>
              <button className="nav-btn" onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Войти</Link>
              <Link to="/register" className="nav-link">Регистрация</Link>
            </>
          )}
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<Recipes />} />
            <Route path="/login" element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register setAuth={setIsAuthenticated} /> : <Navigate to="/" />} />
            <Route path="/create" element={isAuthenticated ? <CreateRecipe /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/diary" element={isAuthenticated ? <FoodDiary /> : <Navigate to="/login" />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App