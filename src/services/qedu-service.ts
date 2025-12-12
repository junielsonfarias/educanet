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

export const getMunicipalityName = (id: string) => {
  const m = availableMunicipalities.find((m) => m.id === id)
  return m ? `${m.name} - ${m.state}` : 'Município Desconhecido'
}
