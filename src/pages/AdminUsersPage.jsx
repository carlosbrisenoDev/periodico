import { useCallback, useEffect, useState } from 'react'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { getId, ui } from '../lib/ui'

export const AdminUsersPage = () => {
  const baseUrl = useApiBaseUrl()
  const [users, setUsers] = useState([])
  const [draftRoles, setDraftRoles] = useState({})
  const [draftActive, setDraftActive] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [responseData, setResponseData] = useState(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiRequest(baseUrl, '/api/v1/auth/users')
      const userList = response?.users ?? []
      setUsers(userList)
      setDraftRoles(
        Object.fromEntries(
          userList.map((user) => [getId(user), user.role]),
        ),
      )
      setDraftActive(
        Object.fromEntries(
          userList.map((user) => [getId(user), Boolean(user.active)]),
        ),
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error cargando usuarios.')
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const saveRole = async (id) => {
    setMessage('')
    setError('')
    try {
      const response = await apiRequest(baseUrl, `/api/v1/auth/users/${id}/role`, {
        method: 'PATCH',
        body: { role: draftRoles[id] },
      })
      setResponseData(response)
      setMessage('Rol actualizado.')
      await loadUsers()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error actualizando rol.')
    }
  }

  const saveActive = async (id) => {
    setMessage('')
    setError('')
    try {
      const response = await apiRequest(baseUrl, `/api/v1/auth/users/${id}/active`, {
        method: 'PATCH',
        body: { active: Boolean(draftActive[id]) },
      })
      setResponseData(response)
      setMessage('Estado activo actualizado.')
      await loadUsers()
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Error actualizando estado activo.',
      )
    }
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Gestión de usuarios</h2>
      <button style={ui.button} type="button" onClick={loadUsers}>
        Actualizar usuarios
      </button>
      {loading ? <p>Cargando...</p> : null}
      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}

      {users.length ? (
        users.map((user) => {
          const userId = getId(user)
          return (
            <article key={userId} style={ui.card}>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <div style={ui.row}>
                <select
                  style={ui.input}
                  value={draftRoles[userId] ?? user.role}
                  onChange={(event) =>
                    setDraftRoles((current) => ({
                      ...current,
                      [userId]: event.target.value,
                    }))
                  }
                >
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                </select>
                <button style={ui.button} type="button" onClick={() => saveRole(userId)}>
                  Guardar rol
                </button>
              </div>
              <div style={ui.row}>
                <label htmlFor={`active-${userId}`}>
                  <input
                    id={`active-${userId}`}
                    type="checkbox"
                    checked={Boolean(draftActive[userId])}
                    onChange={(event) =>
                      setDraftActive((current) => ({
                        ...current,
                        [userId]: event.target.checked,
                      }))
                    }
                  />{' '}
                  Activo
                </label>
                <button style={ui.button} type="button" onClick={() => saveActive(userId)}>
                  Guardar estado
                </button>
              </div>
            </article>
          )
        })
      ) : (
        <p>No hay usuarios.</p>
      )}
      {responseData?.user ? <p>Usuario actualizado correctamente.</p> : null}
    </section>
  )
}
