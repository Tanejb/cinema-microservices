import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8080/api/web/users'

const initialUser = {
  first_name: 'Ana',
  last_name: 'Novak',
  email: `ana.${Date.now()}@example.com`,
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

export default function UsersRemoteApp() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(initialUser)
  const [userId, setUserId] = useState('')
  const [response, setResponse] = useState(null)

  const loadUsers = async () => {
    try {
      const data = await requestJson(API_URL)
      setUsers(data.data || [])
      setResponse(data)
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const createUser = async () => {
    try {
      const data = await requestJson(API_URL, 'POST', form)
      setResponse(data)
      await loadUsers()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const getById = async () => {
    if (!userId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${userId}`))
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const updateById = async () => {
    if (!userId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${userId}`, 'PUT', form))
      await loadUsers()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  const deleteById = async () => {
    if (!userId.trim()) return
    try {
      setResponse(await requestJson(`${API_URL}/${userId}`, 'DELETE'))
      await loadUsers()
    } catch (error) {
      setResponse({ error: error.message })
    }
  }

  return (
    <section>
      <h2>Users CRUD</h2>
      <p>Gateway: <code>{API_URL}</code></p>

      <div>
        <h3>User payload</h3>
        <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="first_name" />
        <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="last_name" />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email" />
        <button onClick={createUser}>Create user</button>
      </div>

      <div>
        <h3>User by id</h3>
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user id" />
        <button onClick={getById}>Get by id</button>
        <button onClick={updateById}>Update by id</button>
        <button onClick={deleteById}>Delete by id</button>
      </div>

      <div>
        <h3>Users list</h3>
        <button onClick={loadUsers}>Refresh list</button>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.first_name} {user.last_name} ({user.email}) - id: {user.id}
            </li>
          ))}
        </ul>
      </div>

      <h3>Last response</h3>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </section>
  )
}
