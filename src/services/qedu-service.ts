/**
 * Mock Service to simulate fetching data from QEdu.
 * In a real application, this would call the QEdu API or a backend proxy.
 */

export interface QEduMunicipality {
  id: string
  name: string
  state: string
}

export const availableMunicipalities: QEduMunicipality[] = [
  { id: '1507300', name: 'São Sebastião da Boa Vista', state: 'PA' },
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

// Mock Data for "São Sebastião da Boa Vista - PA" (ID: 1507300)
const mockDistortionData_1507300: AgeGradeDistortionData[] = [
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

const mockApprovalData_1507300: ApprovalFailureData[] = [
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

const mockSchoolsQEduData_1507300: SchoolQEduData[] = [
  {
    id: 's1',
    name: 'Escola Municipal Monteiro Lobato',
    idebHistory: [
      { year: 2017, score: 4.2, target: 4.5 },
      { year: 2019, score: 4.5, target: 4.8 },
      { year: 2021, score: 4.8, target: 5.0 },
      { year: 2023, score: 5.1, target: 5.2 },
    ],
    approvalHistory: [
      { year: 2017, rate: 85 },
      { year: 2019, rate: 88 },
      { year: 2021, rate: 90 },
      { year: 2023, rate: 92 },
    ],
  },
  {
    id: 's2',
    name: 'Escola Municipal Cecília Meireles',
    idebHistory: [
      { year: 2017, score: 3.8, target: 4.0 },
      { year: 2019, score: 4.0, target: 4.3 },
      { year: 2021, score: 4.2, target: 4.5 },
      { year: 2023, score: 4.6, target: 4.8 },
    ],
    approvalHistory: [
      { year: 2017, rate: 80 },
      { year: 2019, rate: 82 },
      { year: 2021, rate: 85 },
      { year: 2023, rate: 88 },
    ],
  },
  {
    id: 's3',
    name: 'Escola Municipal Vinícius de Moraes',
    idebHistory: [
      { year: 2017, score: 4.5, target: 4.6 },
      { year: 2019, score: 4.7, target: 4.9 },
      { year: 2021, score: 5.0, target: 5.1 },
      { year: 2023, score: 5.3, target: 5.4 },
    ],
    approvalHistory: [
      { year: 2017, rate: 88 },
      { year: 2019, rate: 90 },
      { year: 2021, rate: 92 },
      { year: 2023, rate: 94 },
    ],
  },
]

// Generic mock data for other municipalities to show functionality
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

export const fetchAgeGradeDistortion = async (
  municipalityId: string,
): Promise<AgeGradeDistortionData[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (municipalityId === '1507300') {
    return mockDistortionData_1507300
  }
  return mockGenericDistortionData
}

export const fetchApprovalFailureRates = async (
  municipalityId: string,
): Promise<ApprovalFailureData[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (municipalityId === '1507300') {
    return mockApprovalData_1507300
  }
  return mockGenericApprovalData
}

export const fetchSchoolsQEduData = async (
  municipalityId: string,
): Promise<SchoolQEduData[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (municipalityId === '1507300') {
    return mockSchoolsQEduData_1507300
  }
  return mockGenericSchoolsQEduData
}

export const getMunicipalityName = (id: string) => {
  const m = availableMunicipalities.find((m) => m.id === id)
  return m ? `${m.name} - ${m.state}` : 'Município Desconhecido'
}
