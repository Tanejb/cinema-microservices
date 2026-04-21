import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8080/api/web/movies'

const initialMovie = {
  title: 'Inception',
  description: 'A mind-bending sci-fi thriller.',
  genre: 'Sci-Fi',
  duration: 148,
  ageRating: 'PG-13',
}

async function requestJson(url, method = 'GET', body) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await response.json()
  if (!response.ok) {
    throw new Error(json?.message || `Request failed with status ${response.status}`)
  }
  return json
}

export default function MoviesRemoteApp() {
  const [movies, setMovies] = useState([])
  const [form, setForm] = useState(initialMovie)
  const [movieId, setMovieId] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadMovies = async () => {
    setLoading(true)
    try {
      const data = await requestJson(API_URL)
      setMovies(data.data || [])
      setResponse(data)
    } catch (error) {
      setResponse({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMovies()
  }, [])

  const handleCreate = async () => {
    try {
      const data = await requestJson(API_URL, 'POST', form)
      setResponse(data)
      await loadMovies()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const handleGetById = async () => {
    if (!movieId.trim()) return
    try {
      const data = await requestJson(`${API_URL}/${movieId}`)
      setResponse(data)
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const handleUpdate = async () => {
    if (!movieId.trim()) return
    try {
      const data = await requestJson(`${API_URL}/${movieId}`, 'PUT', form)
      setResponse(data)
      await loadMovies()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const handleDelete = async () => {
    if (!movieId.trim()) return
    try {
      const data = await requestJson(`${API_URL}/${movieId}`, 'DELETE')
      setResponse(data)
      await loadMovies()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  return (
    <section>
      <h2>Movies CRUD</h2>
      <p>Gateway: <code>{API_URL}</code></p>

      <div>
        <h3>Movie payload</h3>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="title" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="description" />
        <input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="genre" />
        <input
          value={form.duration}
          type="number"
          onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
          placeholder="duration"
        />
        <input value={form.ageRating} onChange={(e) => setForm({ ...form, ageRating: e.target.value })} placeholder="ageRating" />
        <button onClick={handleCreate}>Create movie</button>
      </div>

      <div>
        <h3>Movie by id</h3>
        <input value={movieId} onChange={(e) => setMovieId(e.target.value)} placeholder="movie id" />
        <button onClick={handleGetById}>Get by id</button>
        <button onClick={handleUpdate}>Update by id</button>
        <button onClick={handleDelete}>Delete by id</button>
      </div>

      <div>
        <h3>Movies list {loading ? '(loading...)' : ''}</h3>
        <button onClick={loadMovies}>Refresh list</button>
        <ul>
          {movies.map((movie) => (
            <li key={movie.id}>
              {movie.title} ({movie.genre}) - id: {movie.id}
            </li>
          ))}
        </ul>
      </div>

      <h3>Last response</h3>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </section>
  )
}
