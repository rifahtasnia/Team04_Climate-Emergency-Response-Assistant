import { Link, NavLink } from 'react-router-dom'
import { AegisMark } from './AegisMark'

export function PublicHeader() {
  return (
    <header className="public-header">
      <Link className="brand public-brand" to="/" aria-label="AEGIS home">
        <span className="brand-mark" aria-hidden="true"><AegisMark size={21} /></span>
        <span>AEGIS</span>
      </Link>
      <nav aria-label="Response network">
        <NavLink to="/help">Get help</NavLink>
        <NavLink to="/support">Offer support</NavLink>
        <NavLink to="/operations">Coordinate</NavLink>
      </nav>
    </header>
  )
}
