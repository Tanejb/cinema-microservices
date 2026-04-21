import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8080/api/web/screenings'

const initialScreening = {
  movie_id: 'movie-001',
  screening_date: '2026-05-05',
  screening_time: '19:30',
  hall: 'Hall 1',
  total_seats: 100,
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

export default function ScreeningsRemoteApp() {
  const [screenings, setScreenings] = useState([])
  const [form, setForm] = useState(initialScreening)
  const [screeningId, setScreeningId] = useState('')
  const [movieId, setMovieId] = useState('movie-001')
  const [response, setResponse] = useState(null)

  const loadScreenings = async () => {
    try {
      const data = await requestJson(API_URL)
      setScreenings(data.data || [])
      setResponse(data)
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  useEffect(() => {
    loadScreenings()
  }, [])

  const createScreening = async () => {
    try {
      setResponse(await requestJson(API_URL, 'POST', form))
      await loadScreenings()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const getById = async () => {
    if (!screeningId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${screeningId}`))
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const updateById = async () => {
    if (!screeningId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${screeningId}`, 'PUT', form))
      await loadScreenings()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const deleteById = async () => {
    if (!screeningId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${screeningId}`, 'DELETE'))
      await loadScreenings()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const listByMovie = async () => {
    if (!movieId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/movie/${movieId}`))
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  return (
    <section>
      <h2>Screenings CRUD</h2>
      <p>Gateway: <code>{API_URL}</code></p>

      <div>
        <h3>Screening payload</h3>
        <input value={form.movie_id} onChange={(e) => setForm({ ...form, movie_id: e.target.value })} placeholder="movie_id" />
        <input value={form.screening_date} onChange={(e) => setForm({ ...form, screening_date: e.target.value })} placeholder="screening_date" />
        <input value={form.screening_time} onChange={(e) => setForm({ ...form, screening_time: e.target.value })} placeholder="screening_time" />
        <input value={form.hall} onChange={(e) => setForm({ ...form, hall: e.target.value })} placeholder="hall" />
        <input
          value={form.total_seats}
          type="number"
          onChange={(e) => setForm({ ...form, total_seats: Number(e.target.value) })}
          placeholder="total_seats"
        />
        <button onClick={createScreening}>Create screening</button>
      </div>

      <div>
        <h3>Screening by id</h3>
        <input value={screeningId} onChange={(e) => setScreeningId(e.target.value)} placeholder="screening id" />
        <button onClick={getById}>Get by id</button>
        <button onClick={updateById}>Update by id</button>
        <button onClick={deleteById}>Delete by id</button>
      </div>

      <div>
        <h3>List by movie id</h3>
        <input value={movieId} onChange={(e) => setMovieId(e.target.value)} placeholder="movie id" />
        <button onClick={listByMovie}>Get by movie id</button>
      </div>

      <div>
        <h3>Screenings list</h3>
        <button onClick={loadScreenings}>Refresh list</button>
        <ul>
          {screenings.map((screening) => (
            <li key={screening.id}>
              {screening.movie_id} | {screening.screening_date} {screening.screening_time} | {screening.hall} | id: {screening.id}
            </li>
          ))}
        </ul>
      </div>

      <h3>Last response</h3>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </section>
  )
}
