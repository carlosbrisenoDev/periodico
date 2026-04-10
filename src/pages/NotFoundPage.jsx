import { Link } from 'react-router-dom'
import { ui } from '../lib/ui'

export const NotFoundPage = () => (
  <section style={ui.card}>
    <h2>404</h2>
    <p>Ruta no encontrada.</p>
    <p>
      <Link to="/">Volver al inicio</Link>
    </p>
  </section>
)
