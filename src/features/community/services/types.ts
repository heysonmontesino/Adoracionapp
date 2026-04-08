export interface ChurchService {
  id: string
  name: string
  schedule: string
  dayOfWeek: number | null
  startTime: string | null
  location: string
  address: string | null
  mapsURL: string | null
  active: boolean
}
