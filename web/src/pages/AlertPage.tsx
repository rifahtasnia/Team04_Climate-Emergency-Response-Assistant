import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Languages,
  MapPin,
  MessageSquareText,
  Smartphone,
} from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { useOperations } from '../state/OperationsContext'

export function AlertPage() {
  const navigate = useNavigate()
  const { city, hazard, selectedIncident, stage, authorizeAlert } = useOperations()
  const [language, setLanguage] = useState<'en' | 'fr'>('en')
  const published = stage === 'published'
  if (!selectedIncident || !city) return null

  const messages = {
    en: {
      title: `${hazard} warning — ${selectedIncident.location}`,
      body:
        `${hazard} conditions have been reported near ${selectedIncident.location}. ` +
        'Avoid the affected area and follow instructions from local authorities. ' +
        'If you are in immediate danger, move to a safe location and contact local emergency services. ' +
        'Do not enter closed or restricted areas.',
    },
    fr: {
      title: `Alerte — ${selectedIncident.location}`,
      body:
        `Des conditions d’urgence ont été signalées près de ${selectedIncident.location}. ` +
        'Évitez le secteur touché et suivez les directives des autorités locales. ' +
        'En cas de danger immédiat, rendez-vous dans un lieu sûr et contactez les services d’urgence locaux. ' +
        'N’entrez pas dans les zones fermées ou interdites.',
    },
  }
  const message = messages[language]

  return (
    <div className="page alert-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">INCIDENT {selectedIncident.shortId}</p>
          <h1>Public alert</h1>
          <p className="heading-meta">
            Confirmed facts and protective instructions only
          </p>
        </div>
        <StatusBadge tone={published ? 'success' : 'warning'}>
          {published ? 'Content approved' : 'Approval required'}
        </StatusBadge>
      </div>

      <div className="alert-layout">
        <section className="panel message-editor">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MESSAGE</p>
              <h2>Emergency warning</h2>
            </div>
            <div className="language-switch" role="group" aria-label="Message language">
              <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
              <button type="button" className={language === 'fr' ? 'active' : ''} onClick={() => setLanguage('fr')}>FR</button>
            </div>
          </div>
          <label>
            Headline
            <input value={message.title} readOnly />
          </label>
          <label>
            Instructions
            <textarea value={message.body} readOnly />
          </label>
          <div className="message-checks">
            <span><CheckCircle2 size={15} /> Geocoded location confirmed</span>
            <span><CheckCircle2 size={15} /> Unsupported claims excluded</span>
            <span><CheckCircle2 size={15} /> Plain-language review passed</span>
          </div>
        </section>

        <section className="panel delivery-panel">
          <p className="eyebrow">DELIVERY</p>
          <h2>Audience and channels</h2>
          <div className="delivery-zone">
            <MapPin size={19} />
            <div>
              <strong>{selectedIncident.location}</strong>
              <span>Incident-centred delivery zone · provider audience estimate pending</span>
            </div>
          </div>
          <div className="channel-list">
            <div><MessageSquareText size={18} /><span>SMS and emergency notification</span><strong>Provider required</strong></div>
            <div><Smartphone size={18} /><span>Municipal mobile application</span><strong>Provider required</strong></div>
            <div><Languages size={18} /><span>English and French</span><strong>Content ready</strong></div>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              if (!published) authorizeAlert()
              navigate('/operations/accountability')
            }}
          >
            {published ? 'View accountability record' : 'Approve warning content'}
            <ArrowRight size={17} />
          </button>
        </section>

        <section className="phone-preview" aria-label="Mobile alert preview">
          <div className="phone-speaker" />
          <div className="phone-status"><span>{selectedIncident.updated}</span><span>5G</span></div>
          <div className="phone-alert-icon"><MessageSquareText size={22} /></div>
          <p className="eyebrow">{city.name.toUpperCase()} EMERGENCY ALERT</p>
          <h2>{message.title}</h2>
          <p>{message.body}</p>
          <span className="phone-time">Now</span>
        </section>
      </div>
    </div>
  )
}
