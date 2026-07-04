import { useState, type FormEvent } from 'react'
import { CheckCircle2, Home, UsersRound } from 'lucide-react'
import { LocationSearch } from '../components/OperationsSetup'
import { PublicHeader } from '../components/PublicHeader'
import { useResponseNetwork } from '../state/ResponseNetworkContext'
import type { AidCategory, CityProfile } from '../types'

const volunteerSkills: AidCategory[] = [
  'Transportation',
  'Food and water',
  'Accommodation',
  'Power support',
]

export function PartnerSupportPage() {
  const { submitVolunteerOffer, submitShelterOffer } = useResponseNetwork()
  const [mode, setMode] = useState<'volunteer' | 'shelter'>('volunteer')
  const [name, setName] = useState('')
  const [location, setLocation] = useState<CityProfile | null>(null)
  const [skills, setSkills] = useState<AidCategory[]>([])
  const [travelRadiusKm, setTravelRadiusKm] = useState(10)
  const [spaces, setSpaces] = useState(1)
  const [accessible, setAccessible] = useState(false)
  const [acceptsPets, setAcceptsPets] = useState(false)
  const [generator, setGenerator] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !location) return
    if (mode === 'volunteer') {
      if (skills.length === 0) return
      const offer = submitVolunteerOffer({
        volunteerName: name.trim(),
        location,
        skills,
        travelRadiusKm,
        available: true,
      })
      setConfirmation(offer.id)
    } else {
      const offer = submitShelterOffer({
        providerName: name.trim(),
        location,
        spaces,
        accessible,
        acceptsPets,
        generator,
        available: true,
      })
      setConfirmation(offer.id)
    }
  }

  return (
    <div className="public-shell">
      <PublicHeader />
      <main className="public-page partner-page">
        <section className="public-page-heading">
          <div>
            <p className="eyebrow">OFFER SUPPORT</p>
            <h1>Share capacity responders can verify and coordinate.</h1>
            <p>Offers are not shown to residents or assigned until an authorized coordinator verifies them.</p>
          </div>
        </section>

        <div className="partner-mode-switch" role="group" aria-label="Support type">
          <button type="button" className={mode === 'volunteer' ? 'active' : ''} onClick={() => { setMode('volunteer'); setConfirmation('') }}>
            <UsersRound size={18} /> Volunteer
          </button>
          <button type="button" className={mode === 'shelter' ? 'active' : ''} onClick={() => { setMode('shelter'); setConfirmation('') }}>
            <Home size={18} /> Shelter provider
          </button>
        </div>

        {confirmation ? (
          <section className="request-confirmation partner-confirmation">
            <CheckCircle2 size={30} />
            <p className="eyebrow">AVAILABILITY SUBMITTED</p>
            <h2>Verification pending</h2>
            <p>Reference {confirmation}. Keep availability current; a coordinator will confirm identity, capability, and capacity before matching.</p>
            <button className="secondary-button" type="button" onClick={() => setConfirmation('')}>Submit another offer</button>
          </section>
        ) : (
          <form className="setup-form partner-form" onSubmit={submit}>
            <label>
              {mode === 'volunteer' ? 'Volunteer name' : 'Organization or provider name'}
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <LocationSearch
              legend={mode === 'volunteer' ? 'Current location' : 'Shelter location'}
              placeholder="Search address or landmark"
              onSelect={setLocation}
            />

            {mode === 'volunteer' ? (
              <>
                <fieldset>
                  <legend>What verified support can you provide?</legend>
                  <div className="choice-grid">
                    {volunteerSkills.map((skill) => (
                      <label key={skill} className={skills.includes(skill) ? 'selected' : ''}>
                        <input
                          type="checkbox"
                          checked={skills.includes(skill)}
                          onChange={() =>
                            setSkills((current) =>
                              current.includes(skill)
                                ? current.filter((candidate) => candidate !== skill)
                                : [...current, skill],
                            )
                          }
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label>
                  Maximum travel radius
                  <div className="range-value"><input type="range" min="1" max="50" value={travelRadiusKm} onChange={(event) => setTravelRadiusKm(Number(event.target.value))} /><strong>{travelRadiusKm} km</strong></div>
                </label>
              </>
            ) : (
              <>
                <label>
                  Spaces available now
                  <input type="number" min="1" max="10000" value={spaces} onChange={(event) => setSpaces(Number(event.target.value))} required />
                </label>
                <fieldset>
                  <legend>Facility support</legend>
                  <div className="choice-grid compact-choices">
                    <label className={accessible ? 'selected' : ''}><input type="checkbox" checked={accessible} onChange={(event) => setAccessible(event.target.checked)} />Step-free access</label>
                    <label className={acceptsPets ? 'selected' : ''}><input type="checkbox" checked={acceptsPets} onChange={(event) => setAcceptsPets(event.target.checked)} />Accepts pets</label>
                    <label className={generator ? 'selected' : ''}><input type="checkbox" checked={generator} onChange={(event) => setGenerator(event.target.checked)} />Backup power</label>
                  </div>
                </fieldset>
              </>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={
                !name.trim() ||
                !location ||
                (mode === 'volunteer' && skills.length === 0)
              }
            >
              Submit availability
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
