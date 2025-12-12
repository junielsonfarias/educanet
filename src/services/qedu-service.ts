/**
 * Service to fetch data from QEdu API.
 * Uses VITE_QEDU_API_KEY for authentication.
 */

export interface QEduMunicipality {
  id: string
  name: string
  state: string
}

export const availableMunicipalities: QEduMunicipality[] = [
  { id: '1507706', name: 'São Sebastião da Boa Vista', state: 'PA' }, // Updated ID based on User Story
  { id: '1501402', name: 'Belém', state: 'PA' },
  { id: '3550308', name: 'São Paulo', state: 'SP' },
  { id: '3304557', name: 'Rio de Janeiro', state: 'RJ' },
]

export interface AgeGradeDistortionData {
  year: number
  series: string // e.g., "1º ano", "5º ano", "9º ano"
  distortionRate: number // percentage
}

export interface ApprovalFailureData {
  year: number
  stage: 'Anos Iniciais' | 'Anos Finais' | 'Ensino Médio'
  approvalRate: number
  failureRate: number
  dropoutRate: number
}

export interface SchoolQEduData {
  id: string
  name: string
  idebHistory: { year: number; score: number; target?: number }[]
  approvalHistory: { year: number; rate: number }[]
}

export interface MunicipalityQEduData {
  municipalityId: string
  schools: SchoolQEduData[]
}

const API_KEY = import.meta.env.VITE_QEDU_API_KEY
const BASE_URL = 'https://api.qedu.org.br/v1' // Base URL for QEdu API

// --- MOCK DATA FOR FALLBACK OR OTHER ENDPOINTS ---

// Mock Data for "São Sebastião da Boa Vista - PA" (Using new ID 1507706 for consistency)
const mockDistortionData_1507706: AgeGradeDistortionData[] = [
  { year: 2023, series: '1º ano', distortionRate: 5.2 },
  { year: 2023, series: '2º ano', distortionRate: 12.5 },
  { year: 2023, series: '3º ano', distortionRate: 18.3 },
  { year: 2023, series: '4º ano', distortionRate: 22.1 },
  { year: 2023, series: '5º ano', distortionRate: 28.7 },
  { year: 2023, series: '6º ano', distortionRate: 35.4 },
  { year: 2023, series: '7º ano', distortionRate: 32.1 },
  { year: 2023, series: '8º ano', distortionRate: 30.5 },
  { year: 2023, series: '9º ano', distortionRate: 29.8 },
]

const mockApprovalData_1507706: ApprovalFailureData[] = [
  {
    year: 2023,
    stage: 'Anos Iniciais',
    approvalRate: 88.5,
    failureRate: 8.2,
    dropoutRate: 3.3,
  },
  {
    year: 2023,
    stage: 'Anos Finais',
    approvalRate: 82.1,
    failureRate: 12.4,
    dropoutRate: 5.5,
  },
  {
    year: 2023,
    stage: 'Ensino Médio',
    approvalRate: 78.9,
    failureRate: 10.5,
    dropoutRate: 10.6,
  },
]

// Mock Schools data specifically for Fallback or other cities
const mockGenericSchoolsQEduData: SchoolQEduData[] = [
  {
    id: 'g1',
    name: 'Escola Exemplo A',
    idebHistory: [
      { year: 2019, score: 5.0 },
      { year: 2021, score: 5.2 },
      { year: 2023, score: 5.5 },
    ],
    approvalHistory: [
      { year: 2019, rate: 90 },
      { year: 2021, rate: 92 },
      { year: 2023, rate: 95 },
    ],
  },
  {
    id: 'g2',
    name: 'Escola Exemplo B',
    idebHistory: [
      { year: 2019, score: 4.0 },
      { year: 2021, score: 4.2 },
      { year: 2023, score: 4.5 },
    ],
    approvalHistory: [
      { year: 2019, rate: 80 },
      { year: 2021, rate: 85 },
      { year: 2023, rate: 88 },
    ],
  },
]

const mockGenericDistortionData: AgeGradeDistortionData[] = [
  { year: 2023, series: '1º ano', distortionRate: 2.0 },
  { year: 2023, series: '5º ano', distortionRate: 15.0 },
  { year: 2023, series: '9º ano', distortionRate: 20.0 },
]

const mockGenericApprovalData: ApprovalFailureData[] = [
  {
    year: 2023,
    stage: 'Anos Iniciais',
    approvalRate: 95.0,
    failureRate: 4.0,
    dropoutRate: 1.0,
  },
  {
    year: 2023,
    stage: 'Anos Finais',
    approvalRate: 90.0,
    failureRate: 8.0,
    dropoutRate: 2.0,
  },
]

// --- FETCH FUNCTIONS ---

export const fetchAgeGradeDistortion = async (
  municipalityId: string,
): Promise<AgeGradeDistortionData[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (municipalityId === '1507706' || municipalityId === '1507300') {
    return mockDistortionData_1507706
  }
  return mockGenericDistortionData
}

export const fetchApprovalFailureRates = async (
  municipalityId: string,
): Promise<ApprovalFailureData[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (municipalityId === '1507706' || municipalityId === '1507300') {
    return mockApprovalData_1507706
  }
  return mockGenericApprovalData
}

// Helper to transform API School object to our interface
const mapApiSchoolToLocal = (apiSchool: any): SchoolQEduData => {
  // Try to extract IDEB history from API response
  // Assuming API returns 'ideb' object with years or 'history'
  const idebHistory = []
  if (apiSchool.ideb && typeof apiSchool.ideb === 'object') {
    // If ideb is key-value pair year:score
    Object.entries(apiSchool.ideb).forEach(([year, score]) => {
      if (!isNaN(Number(year))) {
        idebHistory.push({
          year: Number(year),
          score: Number(score),
          target: apiSchool.ideb_metas?.[year] || undefined,
        })
      }
    })
  } else if (Array.isArray(apiSchool.ideb_history)) {
    // If it's an array
    idebHistory.push(
      ...apiSchool.ideb_history.map((h: any) => ({
        year: h.year,
        score: h.score,
        target: h.target,
      })),
    )
  }

  // Fallback if no history found but current ideb exists
  if (idebHistory.length === 0 && apiSchool.ideb_current) {
    idebHistory.push({ year: 2023, score: apiSchool.ideb_current })
  }

  // Try to extract Approval history
  const approvalHistory = []
  if (apiSchool.approval && typeof apiSchool.approval === 'object') {
    Object.entries(apiSchool.approval).forEach(([year, rate]) => {
      if (!isNaN(Number(year))) {
        approvalHistory.push({ year: Number(year), rate: Number(rate) })
      }
    })
  }

  return {
    id: String(apiSchool.id),
    name: apiSchool.name || 'Escola Sem Nome',
    idebHistory: idebHistory.sort((a, b) => a.year - b.year),
    approvalHistory: approvalHistory.sort((a, b) => a.year - b.year),
  }
}

export const fetchSchoolsQEduData = async (
  municipalityId: string,
): Promise<SchoolQEduData[]> => {
  // Check if API Key is configured
  if (!API_KEY) {
    console.warn(
      'QEdu API Key is missing. Please configure VITE_QEDU_API_KEY in .env file. Falling back to mock data.',
    )
    return mockGenericSchoolsQEduData
  }

  // We primarily fetch real data for the requested municipality
  // For others, we might fallback to generic if API doesn't support them or returns empty
  try {
    const url = `${BASE_URL}/cities/${municipalityId}/schools?api_key=${API_KEY}&include=ideb,approval`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(
          `Municipality ${municipalityId} not found in QEdu API. Returning empty list.`,
        )
        return []
      }
      throw new Error(
        `QEdu API Error: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()
    const schoolsList = Array.isArray(data) ? data : data.data || data.schools

    if (!schoolsList || !Array.isArray(schoolsList)) {
      console.warn('Invalid data format received from QEdu API', data)
      return []
    }

    const mappedSchools = schoolsList.map(mapApiSchoolToLocal)

    // Filter out schools with no data if desired, or return all
    return mappedSchools
  } catch (error) {
    console.error('Failed to fetch data from QEdu API:', error)
    // In production, we might want to throw the error to show it to the user
    // instead of showing fake data, as requested by the User Story ("replacing mock data")
    throw error
  }
}

export const getMunicipalityName = (id: string) => {
  const m = availableMunicipalities.find((m) => m.id === id)
  return m ? `${m.name} - ${m.state}` : 'Município Desconhecido'
}
