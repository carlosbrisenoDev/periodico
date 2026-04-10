import { useOutletContext } from 'react-router-dom'
import { API_BASE_URL } from '../lib/apiClient'

export const useApiBaseUrl = () => {
  const context = useOutletContext()
  if (context && typeof context.baseUrl === 'string' && context.baseUrl.trim()) {
    return context.baseUrl
  }
  return API_BASE_URL
}
