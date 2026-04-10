import { useCallback, useEffect, useState } from 'react'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { getId, ui } from '../lib/ui'

export const AdminImagesPage = () => {
  const baseUrl = useApiBaseUrl()
  const [limit, setLimit] = useState('20')
  const [images, setImages] = useState([])
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [responseData, setResponseData] = useState(null)

  const loadImages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiRequest(baseUrl, '/api/v1/image', { query: { limit } })
      setImages(response ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error cargando imágenes.')
    } finally {
      setLoading(false)
    }
  }, [baseUrl, limit])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  const uploadImage = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setResponseData(null)
    if (!file) {
      setError('Selecciona un archivo.')
      return
    }

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await apiRequest(baseUrl, '/api/v1/image/upload', {
        method: 'POST',
        formData,
      })
      setResponseData(response)
      setMessage('Imagen subida.')
      setFile(null)
      await loadImages()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error subiendo imagen.')
    }
  }

  const deleteImage = async (id) => {
    setMessage('')
    setError('')
    try {
      const response = await apiRequest(baseUrl, `/api/v1/image/${id}`, { method: 'DELETE' })
      setResponseData(response)
      setMessage('Imagen eliminada.')
      await loadImages()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error eliminando imagen.')
    }
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Biblioteca de imágenes</h2>
      <div style={ui.row}>
        <input
          style={ui.input}
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          placeholder="Limit"
        />
        <button style={ui.button} type="button" onClick={loadImages}>
          Actualizar lista
        </button>
      </div>

      <form onSubmit={uploadImage}>
        <h3>Subir imagen</h3>
        <input
          style={ui.input}
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button style={ui.button} type="submit">
          Subir
        </button>
      </form>

      {loading ? <p>Cargando...</p> : null}
      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}

      <h3>Listado de imágenes</h3>
      {images.length ? (
        <ul style={ui.list}>
          {images.map((image) => (
            <li key={getId(image)}>
              <a href={image.url} rel="noreferrer" style={ui.link} target="_blank">
                {image.filename}
              </a>{' '}
              <button style={ui.button} type="button" onClick={() => deleteImage(getId(image))}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay imágenes.</p>
      )}
      {responseData?.url ? <p>Imagen disponible: {responseData.url}</p> : null}
    </section>
  )
}
