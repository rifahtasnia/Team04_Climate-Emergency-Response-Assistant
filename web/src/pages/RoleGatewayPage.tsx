import { ArrowRight, Building2, HandHeart, Radio } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'

export function RoleGatewayPage() {
  return (
    <div className="public-shell">
      <PublicHeader />
      <main className="gateway-main">
        <div className="gateway-intro">
          <p className="eyebrow">FLOOD RESPONSE NETWORK</p>
          <h1>One request. The right help. A coordinated response.</h1>
          <p>
            AEGIS connects affected residents, verified community capacity, and
            authorized response coordinators without mixing their workflows.
          </p>
        </div>
        <div className="role-paths">
          <Link to="/help">
            <span className="role-icon"><Radio size={23} /></span>
            <small>Residents</small>
            <h2>I need help</h2>
            <p>Request rescue, medical aid, transport, food, power support, or accommodation.</p>
            <strong>Open assistance <ArrowRight size={16} /></strong>
          </Link>
          <Link to="/support">
            <span className="role-icon"><HandHeart size={23} /></span>
            <small>Community partners</small>
            <h2>I can help</h2>
            <p>Share volunteer skills, transport, supplies, or available shelter space.</p>
            <strong>Offer support <ArrowRight size={16} /></strong>
          </Link>
          <Link to="/operations">
            <span className="role-icon"><Building2 size={23} /></span>
            <small>Municipalities and NGOs</small>
            <h2>Coordinate response</h2>
            <p>Assess reports, match resources, authorize routes, and maintain accountability.</p>
            <strong>Open command view <ArrowRight size={16} /></strong>
          </Link>
        </div>
      </main>
    </div>
  )
}
