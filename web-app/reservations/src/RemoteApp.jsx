import { useState } from 'react'

const API_URL = 'http://localhost:8080/api/web/reservations'

const initialReservation = {
  screening_id: 'screening-demo-001',
  seat_number: 'A1',
  user_name: 'Ana Novak',
  user_email: 'ana@example.com',
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

export default function ReservationsRemoteApp() {
  const [form, setForm] = useState(initialReservation)
  const [reservationId, setReservationId] = useState('')
  const [screeningId, setScreeningId] = useState('screening-demo-001')
  const [response, setResponse] = useState(null)

  const createReservation = async () => {
    try {
      setResponse(await requestJson(API_URL, 'POST', form))
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const getById = async () => {
    if (!reservationId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${reservationId}`))
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const listByScreening = async () => {
    if (!screeningId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/screening/${screeningId}`))
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const cancelReservation = async () => {
    if (!reservationId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${reservationId}/cancel`, 'POST'))
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const deleteReservation = async () => {
    if (!reservationId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${reservationId}`, 'DELETE'))
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  return (
    <section>
      <h2>Reservations flow</h2>
      <p>Gateway: <code>{API_URL}</code></p>

      <div>
        <h3>Create reservation</h3>
        <input value={form.screening_id} onChange={(e) => setForm({ ...form, screening_id: e.target.value })} placeholder="screening_id" />
        <input value={form.seat_number} onChange={(e) => setForm({ ...form, seat_number: e.target.value })} placeholder="seat_number" />
        <input value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} placeholder="user_name" />
        <input value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} placeholder="user_email" />
        <button onClick={createReservation}>Create</button>
      </div>

      <div>
        <h3>Reservation by id</h3>
        <input value={reservationId} onChange={(e) => setReservationId(e.target.value)} placeholder="reservation id" />
        <button onClick={getById}>Get by id</button>
        <button onClick={cancelReservation}>Cancel (POST)</button>
        <button onClick={deleteReservation}>Delete (soft)</button>
      </div>

      <div>
        <h3>Reservations by screening</h3>
        <input value={screeningId} onChange={(e) => setScreeningId(e.target.value)} placeholder="screening id" />
        <button onClick={listByScreening}>List by screening</button>
      </div>

      <h3>Last response</h3>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </section>
  )
}
