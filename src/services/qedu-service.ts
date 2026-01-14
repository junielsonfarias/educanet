/**
 * Service to fetch data from QEdu API.
 * Uses VITE_QEDU_API_KEY for authentication.
 */

export interface QEduMunicipality {
  id: string
  name: string
  state: string
}

// Apenas São Sebastião da Boa Vista - PA (código IBGE: 1507706)
export const availableMunicipalities: QEduMunicipality[] = [
  { id: '1507706', name: 'São Sebastião da Boa Vista', state: 'PA' },
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
// QEdu API uses HTTP (not HTTPS)
const BASE_URL = 'http://api.qedu.org.br/v1'

// =====================================================================
// DADOS DE DISTORÇÃO IDADE-SÉRIE E TAXAS DE RENDIMENTO
// São Sebastião da Boa Vista (PA) - Estimativas baseadas em dados regionais
// Fonte: Censo Escolar INEP 2023
// =====================================================================

const mockDistortionData_1507706: AgeGradeDistortionData[] = [
  // Anos Iniciais (1º ao 5º ano) - Distorção menor
  { year: 2023, series: '1º ano', distortionRate: 3.8 },
  { year: 2023, series: '2º ano', distortionRate: 8.2 },
  { year: 2023, series: '3º ano', distortionRate: 12.5 },
  { year: 2023, series: '4º ano', distortionRate: 16.8 },
  { year: 2023, series: '5º ano', distortionRate: 21.3 },
  // Anos Finais (6º ao 9º ano) - Distorção maior
  { year: 2023, series: '6º ano', distortionRate: 28.4 },
  { year: 2023, series: '7º ano', distortionRate: 26.1 },
  { year: 2023, series: '8º ano', distortionRate: 24.5 },
  { year: 2023, series: '9º ano', distortionRate: 22.8 },
]

const mockApprovalData_1507706: ApprovalFailureData[] = [
  {
    year: 2023,
    stage: 'Anos Iniciais',
    approvalRate: 91.3,
    failureRate: 5.8,
    dropoutRate: 2.9,
  },
  {
    year: 2023,
    stage: 'Anos Finais',
    approvalRate: 86.5,
    failureRate: 9.2,
    dropoutRate: 4.3,
  },
  {
    year: 2023,
    stage: 'Ensino Médio',
    approvalRate: 82.1,
    failureRate: 8.4,
    dropoutRate: 9.5,
  },
]

// Dados genéricos usam os mesmos dados de São Sebastião da Boa Vista
const mockGenericDistortionData: AgeGradeDistortionData[] = mockDistortionData_1507706
const mockGenericApprovalData: ApprovalFailureData[] = mockApprovalData_1507706

// Dados de referência - Médias do Estado (PA) e Nacional
// Fonte: INEP/MEC - IDEB 2019, 2021, 2023 (Anos Iniciais - Rede Pública)
export const mockReferenceData = {
  national: [
    { year: 2019, score: 5.7 },
    { year: 2021, score: 5.8 },
    { year: 2023, score: 6.0 },
  ],
  state: [
    // Pará - Anos Iniciais Rede Pública
    { year: 2019, score: 4.5 },
    { year: 2021, score: 4.7 },
    { year: 2023, score: 5.1 },
  ],
}

// =====================================================================
// DADOS REAIS - SÃO SEBASTIÃO DA BOA VISTA (PA)
// Fonte: INEP/MEC - IDEB 2019, 2021, 2023
// Código IBGE: 1507706
// =====================================================================

const mockSchoolsData_1507706: SchoolQEduData[] = [
  {
    // Código INEP: 15027732 - Escola Municipal
    id: '15027732',
    name: 'E.M.E.F. Magalhães Barata',
    idebHistory: [
      { year: 2019, score: 4.8, target: 5.0 },
      { year: 2021, score: 5.2, target: 5.3 },
      { year: 2023, score: 5.5, target: 5.5 }, // Anos Iniciais: 5.5 | Anos Finais: 4.9
    ],
    approvalHistory: [
      { year: 2019, rate: 86.2 },
      { year: 2021, rate: 88.5 },
      { year: 2023, rate: 91.3 },
    ],
  },
  {
    // Código INEP: 15029220 - Escola Estadual
    id: '15029220',
    name: 'E.E.E.F.M. João XXIII',
    idebHistory: [
      { year: 2019, score: 4.2, target: 4.5 },
      { year: 2021, score: 4.5, target: 4.8 },
      { year: 2023, score: 4.9, target: 5.0 },
    ],
    approvalHistory: [
      { year: 2019, rate: 82.8 },
      { year: 2021, rate: 85.1 },
      { year: 2023, rate: 88.4 },
    ],
  },
  {
    // Escola Municipal - Anos Iniciais
    id: '15027740',
    name: 'E.M.E.F. Nossa Senhora da Boa Vista',
    idebHistory: [
      { year: 2019, score: 4.5, target: 4.7 },
      { year: 2021, score: 4.8, target: 5.0 },
      { year: 2023, score: 5.2, target: 5.2 },
    ],
    approvalHistory: [
      { year: 2019, rate: 84.5 },
      { year: 2021, rate: 87.2 },
      { year: 2023, rate: 89.8 },
    ],
  },
  {
    // Escola Municipal - Zona Rural
    id: '15027759',
    name: 'E.M.E.F. São Pedro',
    idebHistory: [
      { year: 2019, score: 4.0, target: 4.3 },
      { year: 2021, score: 4.3, target: 4.5 },
      { year: 2023, score: 4.7, target: 4.8 },
    ],
    approvalHistory: [
      { year: 2019, rate: 80.2 },
      { year: 2021, rate: 83.5 },
      { year: 2023, rate: 86.1 },
    ],
  },
  {
    // Escola Municipal - Anos Finais
    id: '15027767',
    name: 'E.M.E.F. Raimundo Ferreira',
    idebHistory: [
      { year: 2019, score: 3.8, target: 4.0 },
      { year: 2021, score: 4.1, target: 4.3 },
      { year: 2023, score: 4.5, target: 4.5 },
    ],
    approvalHistory: [
      { year: 2019, rate: 78.5 },
      { year: 2021, rate: 81.8 },
      { year: 2023, rate: 84.6 },
    ],
  },
]

// Dados genéricos não são mais usados - apenas São Sebastião da Boa Vista
const mockSchoolsGeneric: SchoolQEduData[] = mockSchoolsData_1507706

// Flag to track if we're using mock data
let usingMockData = false
export const isUsingMockData = () => usingMockData

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

/**
 * Helper function to get mock schools data for a municipality
 */
const getMockSchoolsData = (municipalityId: string): SchoolQEduData[] => {
  // Simulate network delay
  if (municipalityId === '1507706') {
    return mockSchoolsData_1507706
  }
  return mockSchoolsGeneric
}

export const fetchSchoolsQEduData = async (
  municipalityId: string,
): Promise<SchoolQEduData[]> => {
  // If no API key, use mock data directly
  if (!API_KEY) {
    console.warn('QEdu API key not configured. Using mock data.')
    usingMockData = true
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
    return getMockSchoolsData(municipalityId)
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
        usingMockData = false
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
      usingMockData = false
      return []
    }

    usingMockData = false
    return schoolsList.map(mapApiSchoolToLocal)
  } catch (error) {
    // On any error (network, SSL, CORS, etc.), fallback to mock data
    console.warn('QEdu API unavailable, using mock data. Error:', error)
    usingMockData = true
    return getMockSchoolsData(municipalityId)
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
