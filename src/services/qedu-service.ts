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
  { id: '1507706', name: 'São Sebastião da Boa Vista', state: 'PA' },
  { id: '1501402', name: 'Belém', state: 'PA' },
  { id: '3550308', name: 'São Paulo', state: 'SP' },
  { id: '3304557', name: 'Rio de Janeiro', state: 'RJ' },
  { id: '1302603', name: 'Manaus', state: 'AM' },
  { id: '2304400', name: 'Fortaleza', state: 'CE' },
  { id: '5300108', name: 'Brasília', state: 'DF' },
  { id: '2927408', name: 'Salvador', state: 'BA' },
]

export interface AgeGradeDistortionData {
  year: number
  series: string
  distortionRate: number
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

export interface AggregatedMunicipalityData {
  id: string
  name: string
  idebHistory: { year: number; score: number }[]
}

const API_KEY = import.meta.env.VITE_QEDU_API_KEY
const BASE_URL = 'https://api.qedu.org.br/v1'

// --- MOCK DATA FOR OTHER REPORTS (DISTORTION / APPROVAL) ---

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

// Mock reference data for State/National averages (as API doesn't provide easy aggregate endpoint for these)
export const mockReferenceData = {
  national: [
    { year: 2017, score: 5.5 },
    { year: 2019, score: 5.7 },
    { year: 2021, score: 5.8 },
    { year: 2023, score: 6.0 },
  ],
  state: [
    { year: 2017, score: 4.8 },
    { year: 2019, score: 5.0 },
    { year: 2021, score: 5.2 },
    { year: 2023, score: 5.4 },
  ],
}

// --- FETCH FUNCTIONS ---

export const fetchAgeGradeDistortion = async (
  municipalityId: string,
): Promise<AgeGradeDistortionData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  if (municipalityId === '1507706' || municipalityId === '1507300') {
    return mockDistortionData_1507706
  }
  return mockGenericDistortionData
}

export const fetchApprovalFailureRates = async (
  municipalityId: string,
): Promise<ApprovalFailureData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  if (municipalityId === '1507706' || municipalityId === '1507300') {
    return mockApprovalData_1507706
  }
  return mockGenericApprovalData
}

// --- REAL API INTEGRATION FOR SCHOOLS ---

const mapApiSchoolToLocal = (apiSchool: any): SchoolQEduData => {
  const idebHistory: { year: number; score: number; target?: number }[] = []

  let idebSource = apiSchool.ideb
  if (!idebSource && apiSchool.ideb_anos_iniciais)
    idebSource = apiSchool.ideb_anos_iniciais
  if (!idebSource && apiSchool.ideb_anos_finais)
    idebSource = apiSchool.ideb_anos_finais

  if (idebSource && typeof idebSource === 'object') {
    Object.entries(idebSource).forEach(([year, score]) => {
      const y = Number(year)
      const s = Number(score)
      if (!isNaN(y) && !isNaN(s)) {
        idebHistory.push({
          year: y,
          score: s,
          target: apiSchool.metas?.[year]
            ? Number(apiSchool.metas[year])
            : undefined,
        })
      }
    })
  }

  const approvalHistory: { year: number; rate: number }[] = []
  if (apiSchool.approval && typeof apiSchool.approval === 'object') {
    Object.entries(apiSchool.approval).forEach(([year, rate]) => {
      const y = Number(year)
      const r = Number(rate)
      if (!isNaN(y) && !isNaN(r)) {
        approvalHistory.push({ year: y, rate: r })
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
  if (!API_KEY) {
    throw new Error(
      'Chave de API do QEdu não configurada. Verifique as variáveis de ambiente.',
    )
  }

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
        return []
      }
      throw new Error(
        `Falha na comunicação com API QEdu: ${response.status} ${response.statusText}`,
      )
    }

    const json = await response.json()
    const schoolsList = Array.isArray(json)
      ? json
      : json.data || json.schools || []

    if (!Array.isArray(schoolsList)) {
      console.warn('Formato de dados inválido recebido da API QEdu', json)
      return []
    }

    return schoolsList.map(mapApiSchoolToLocal)
  } catch (error) {
    console.error('Erro ao buscar dados do QEdu:', error)
    throw error
  }
}

export const getMunicipalityName = (id: string) => {
  const m = availableMunicipalities.find((m) => m.id === id)
  return m ? `${m.name} - ${m.state}` : 'Município'
}

// Function to fetch and aggregate data for a specific municipality to allow comparison
export const fetchMunicipalityAggregatedData = async (
  id: string,
): Promise<AggregatedMunicipalityData> => {
  const schools = await fetchSchoolsQEduData(id)
  const name = getMunicipalityName(id)

  // Aggregate IDEB
  const yearScores: Record<number, { total: number; count: number }> = {}

  schools.forEach((school) => {
    school.idebHistory.forEach((h) => {
      if (!yearScores[h.year]) yearScores[h.year] = { total: 0, count: 0 }
      yearScores[h.year].total += h.score
      yearScores[h.year].count++
    })
  })

  const idebHistory = Object.entries(yearScores)
    .map(([year, data]) => ({
      year: Number(year),
      score: Number((data.total / data.count).toFixed(1)),
    }))
    .sort((a, b) => a.year - b.year)

  return {
    id,
    name,
    idebHistory,
  }
}
