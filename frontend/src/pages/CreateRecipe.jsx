import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function CreateRecipe() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState([{ product: '', weight_g: '' }])
  const [products, setProducts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/products/').then(res => setProducts(res.data)).catch(console.error)
  }, [])

  const addIngredient = () => setIngredients([...ingredients, { product: '', weight_g: '' }])
  
  const removeIngredient = (index) => {
    const newIng = [...ingredients]
    newIng.splice(index, 1)
    setIngredients(newIng)
  }

  const updateIngredient = (index, field, value) => {
    const newIng = [...ingredients]
    newIng[index][field] = value
    setIngredients(newIng)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validIngredients = ingredients
      .filter(i => i.product && i.weight_g)
      .map(i => ({ product: parseInt(i.product), weight_g: parseFloat(i.weight_g) }))

    try {
      await client.post('/recipes/', { title, description, ingredients: validIngredients })
      navigate('/')
    } catch (err) {
      console.error('Ошибка создания рецепта', err)
      alert('Не удалось создать рецепт. Проверьте данные.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-form">
      <h2>Новый рецепт</h2>
      <input placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} required />
      <textarea placeholder="Описание приготовления" value={description} onChange={e => setDescription(e.target.value)} />
      
      <h3>Ингредиенты</h3>
      {ingredients.map((ing, idx) => (
        <div key={idx} className="ingredient-row">
          <select value={ing.product} onChange={e => updateIngredient(idx, 'product', e.target.value)} required>
            <option value="">Выберите продукт</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="Вес (г)" value={ing.weight_g} onChange={e => updateIngredient(idx, 'weight_g', e.target.value)} required />
          <button type="button" onClick={() => removeIngredient(idx)}>✕</button>
        </div>
      ))}
      <button type="button" className="add-btn" onClick={addIngredient}>+ Добавить ингредиент</button>
      
      <button type="submit" className="submit-btn">Опубликовать рецепт</button>
    </form>
  )
}