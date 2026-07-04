/* oxlint-disable react/only-export-components -- Provider and hook intentionally share one context. */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  HelpRequest,
  ShelterOffer,
  VolunteerOffer,
} from '../types'

interface ResponseNetworkState {
  helpRequests: HelpRequest[]
  volunteerOffers: VolunteerOffer[]
  shelterOffers: ShelterOffer[]
  submitHelpRequest: (request: Omit<HelpRequest, 'id' | 'createdAt' | 'status'>) => HelpRequest
  submitVolunteerOffer: (offer: Omit<VolunteerOffer, 'id' | 'verified'>) => VolunteerOffer
  submitShelterOffer: (offer: Omit<ShelterOffer, 'id' | 'verified'>) => ShelterOffer
  updateRequestStatus: (id: string, status: HelpRequest['status']) => void
  verifyVolunteerOffer: (id: string) => void
  verifyShelterOffer: (id: string) => void
}

const ResponseNetworkContext = createContext<ResponseNetworkState | null>(null)

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`

export function ResponseNetworkProvider({ children }: { children: ReactNode }) {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [volunteerOffers, setVolunteerOffers] = useState<VolunteerOffer[]>([])
  const [shelterOffers, setShelterOffers] = useState<ShelterOffer[]>([])

  const submitHelpRequest = useCallback(
    (request: Omit<HelpRequest, 'id' | 'createdAt' | 'status'>) => {
      const created: HelpRequest = {
        ...request,
        id: makeId('request'),
        createdAt: new Date().toISOString(),
        status: 'Submitted',
      }
      setHelpRequests((current) => [created, ...current])
      return created
    },
    [],
  )

  const submitVolunteerOffer = useCallback(
    (offer: Omit<VolunteerOffer, 'id' | 'verified'>) => {
      const created: VolunteerOffer = {
        ...offer,
        id: makeId('volunteer'),
        verified: false,
      }
      setVolunteerOffers((current) => [created, ...current])
      return created
    },
    [],
  )

  const submitShelterOffer = useCallback(
    (offer: Omit<ShelterOffer, 'id' | 'verified'>) => {
      const created: ShelterOffer = {
        ...offer,
        id: makeId('shelter'),
        verified: false,
      }
      setShelterOffers((current) => [created, ...current])
      return created
    },
    [],
  )

  const updateRequestStatus = useCallback(
    (id: string, status: HelpRequest['status']) => {
      setHelpRequests((current) =>
        current.map((request) => (request.id === id ? { ...request, status } : request)),
      )
    },
    [],
  )

  const verifyVolunteerOffer = useCallback((id: string) => {
    setVolunteerOffers((current) =>
      current.map((offer) => (offer.id === id ? { ...offer, verified: true } : offer)),
    )
  }, [])

  const verifyShelterOffer = useCallback((id: string) => {
    setShelterOffers((current) =>
      current.map((offer) => (offer.id === id ? { ...offer, verified: true } : offer)),
    )
  }, [])

  const value = useMemo(
    () => ({
      helpRequests,
      volunteerOffers,
      shelterOffers,
      submitHelpRequest,
      submitVolunteerOffer,
      submitShelterOffer,
      updateRequestStatus,
      verifyVolunteerOffer,
      verifyShelterOffer,
    }),
    [
      helpRequests,
      volunteerOffers,
      shelterOffers,
      submitHelpRequest,
      submitVolunteerOffer,
      submitShelterOffer,
      updateRequestStatus,
      verifyVolunteerOffer,
      verifyShelterOffer,
    ],
  )

  return (
    <ResponseNetworkContext.Provider value={value}>
      {children}
    </ResponseNetworkContext.Provider>
  )
}

export function useResponseNetwork() {
  const value = useContext(ResponseNetworkContext)
  if (!value) throw new Error('useResponseNetwork must be used within its provider')
  return value
}
