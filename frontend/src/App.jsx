import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Recipes from './pages/Recipes'
import CreateRecipe from './pages/CreateRecipe'
import Profile from './pages/Profile'
import RecipeDetail from './pages/RecipeDetail'
import FoodDiary from './pages/FoodDiary'
import './App.css'

function App() {
  const isAuthenticated = !!localStorage.getItem('access_token')

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="nav-link">Рецепты</Link>
          {isAuthenticated ? (
            <>
              <Link to="/create" className="nav-link">Создать рецепт</Link>
              <Link to="/diary" className="nav-link">Дневник</Link> {}
              <Link to="/profile" className="nav-link">Профиль</Link> {}
              <button className="nav-btn" onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}>Выйти</button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Войти</Link>
          )}
        </nav>
        <Routes>
          <Route path="/" element={<Recipes />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          <Route path="/create" element={isAuthenticated ? <CreateRecipe /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/diary" element={isAuthenticated ? <FoodDiary /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App