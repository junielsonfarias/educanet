/**
 * Exportador Educacenso
 * Gera arquivo no formato exigido pelo Censo Escolar (INEP)
 */

import type {
  School,
  Student,
  Teacher,
  Turma,
  AnoLetivo,
  EtapaEnsino,
  SerieAno,
  Enrollment,
} from '@/lib/mock-data'

export interface EducacensoExportOptions {
  schoolId?: string
  academicYearId?: string
  includeStudents?: boolean
  includeTeachers?: boolean
  includeClassrooms?: boolean
  includeInfrastructure?: boolean
}

export interface EducacensoExportResult {
  success: boolean
  fileName: string
  content: string
  errors?: string[]
  warnings?: string[]
}

/**
 * Formata data para formato Educacenso (DDMMYYYY)
 */
function formatDateForEducacenso(date: string | Date): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}${month}${year}`
}

/**
 * Formata CPF para formato Educacenso (apenas números)
 */
function formatCPFForEducacenso(cpf: string | undefined): string {
  if (!cpf) return ''
  return cpf.replace(/\D/g, '').padStart(11, '0')
}

/**
 * Formata código INEP (8 dígitos)
 */
function formatINEPCode(code: string | undefined): string {
  if (!code) return ''
  return code.replace(/\D/g, '').padStart(8, '0')
}

/**
 * Gera linha de dados da escola (Registro 00)
 */
function generateSchoolRecord(school: School): string {
  const fields = [
    '00', // Tipo de registro
    formatINEPCode(school.inepCode), // Código INEP
    school.name.substring(0, 200), // Nome da escola (máx 200 caracteres)
    school.director?.substring(0, 100) || '', // Nome do diretor
    school.address?.substring(0, 200) || '', // Endereço
    school.city?.substring(0, 100) || '', // Cidade
    school.state?.substring(0, 2) || '', // Estado (UF)
    school.phone?.replace(/\D/g, '') || '', // Telefone
    school.email?.substring(0, 100) || '', // E-mail
    school.administrativeDependency || '', // Dependência administrativa
    school.locationType || '', // Localização (Urbana/Rural)
  ]

  return fields.join('|')
}

/**
 * Gera linha de dados do aluno (Registro 10)
 */
function generateStudentRecord(
  student: Student,
  enrollment: Enrollment,
  school: School,
  academicYear: AnoLetivo,
  turma: Turma,
): string {
  const birthDate = formatDateForEducacenso(student.birthDate || '')
  const enrollmentDate = formatDateForEducacenso(
    enrollment.enrollmentDate || academicYear.startDate || new Date().toISOString(),
  )

  const fields = [
    '10', // Tipo de registro
    formatINEPCode(school.inepCode), // Código INEP da escola
    formatCPFForEducacenso(student.cpf), // CPF do aluno
    student.name.substring(0, 200), // Nome do aluno
    birthDate, // Data de nascimento
    student.gender || '', // Sexo
    student.raceColor || '', // Raça/Cor
    student.nationality || 'Brasileira', // Nacionalidade
    student.birthCountry || 'Brasil', // País de nascimento
    enrollmentDate, // Data de matrícula
    turma.serieAnoName || enrollment.grade || '', // Série/Ano
    turma.shift || '', // Turno
    enrollment.status || 'Cursando', // Situação do aluno
    student.guardian?.substring(0, 200) || '', // Nome do responsável
    formatCPFForEducacenso((student as any).guardianCpf), // CPF do responsável
    student.susCard || '', // Número do SUS
    student.nis || '', // NIS
    (student as any).hasSpecialNeeds ? '1' : '0', // Necessidades especiais
    (student as any).receivesSchoolMeal ? '1' : '0', // Recebe merenda
  ]

  return fields.join('|')
}

/**
 * Gera linha de dados do professor (Registro 20)
 */
function generateTeacherRecord(
  teacher: Teacher,
  school: School,
  subject: string,
): string {
  const fields = [
    '20', // Tipo de registro
    formatINEPCode(school.inepCode), // Código INEP da escola
    formatCPFForEducacenso(teacher.cpf), // CPF do professor
    teacher.name.substring(0, 200), // Nome do professor
    teacher.email?.substring(0, 100) || '', // E-mail
    teacher.phone?.replace(/\D/g, '') || '', // Telefone
    subject.substring(0, 100), // Disciplina
    teacher.role || '', // Cargo/Função
    teacher.employmentBond || '', // Vínculo empregatício
    teacher.contractType || '', // Tipo de contrato
    formatDateForEducacenso(teacher.admissionDate || ''), // Data de admissão
    teacher.academicBackground || '', // Formação acadêmica
  ]

  return fields.join('|')
}

/**
 * Gera linha de dados da turma (Registro 30)
 */
function generateClassroomRecord(
  turma: Turma,
  school: School,
  academicYear: AnoLetivo,
  etapaEnsino: EtapaEnsino | undefined,
): string {
  const fields = [
    '30', // Tipo de registro
    formatINEPCode(school.inepCode), // Código INEP da escola
    turma.name.substring(0, 100), // Nome da turma
    turma.shift || '', // Turno
    etapaEnsino?.codigoCenso || '', // Código da etapa de ensino
    turma.serieAnoName || '', // Série/Ano
    turma.educationModality || '', // Modalidade de ensino
    turma.tipoRegime || '', // Tipo de regime
    String(turma.maxCapacity || 30), // Capacidade máxima
    String(academicYear.name), // Ano letivo
  ]

  return fields.join('|')
}

/**
 * Gera linha de dados de infraestrutura (Registro 40)
 */
function generateInfrastructureRecord(school: School): string {
  const infra = school.infrastructure || {}

  const fields = [
    '40', // Tipo de registro
    formatINEPCode(school.inepCode), // Código INEP da escola
    String(infra.classrooms || 0), // Salas de aula
    String(infra.library || 0 ? 1 : 0), // Biblioteca
    String(infra.computerLab || 0 ? 1 : 0), // Laboratório de informática
    String(infra.scienceLab || 0 ? 1 : 0), // Laboratório de ciências
    String(infra.sportsCourt || 0 ? 1 : 0), // Quadra esportiva
    String(infra.cafeteria || 0 ? 1 : 0), // Refeitório
    String(infra.auditorium || 0 ? 1 : 0), // Auditório
    String(infra.medicalRoom || 0 ? 1 : 0), // Sala de enfermagem
    String(infra.accessible || 0 ? 1 : 0), // Acessibilidade
  ]

  return fields.join('|')
}

/**
 * Valida dados antes de exportar
 */
function validateExportData(
  schools: School[],
  students: Student[],
  teachers: Teacher[],
  options: EducacensoExportOptions,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Validar escola
  if (options.schoolId) {
    const school = schools.find((s) => s.id === options.schoolId)
    if (!school) {
      errors.push('Escola não encontrada')
    } else {
      if (!school.inepCode) {
        errors.push('Escola não possui código INEP cadastrado')
      }
      if (!school.director) {
        warnings.push('Escola não possui diretor cadastrado')
      }
    }
  }

  // Validar alunos
  if (options.includeStudents) {
    const studentsToExport = options.schoolId
      ? students.filter((s) =>
          s.enrollments?.some((e) => e.schoolId === options.schoolId),
        )
      : students

    studentsToExport.forEach((student) => {
      if (!student.cpf) {
        warnings.push(`Aluno ${student.name} não possui CPF cadastrado`)
      }
      if (!student.birthDate) {
        errors.push(`Aluno ${student.name} não possui data de nascimento`)
      }
    })
  }

  // Validar professores
  if (options.includeTeachers) {
    const teachersToExport = options.schoolId
      ? teachers.filter((t) => t.schoolId === options.schoolId)
      : teachers

    teachersToExport.forEach((teacher) => {
      if (!teacher.cpf) {
        warnings.push(`Professor ${teacher.name} não possui CPF cadastrado`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Exporta dados no formato Educacenso
 */
export function exportEducacenso(
  schools: School[],
  students: Student[],
  teachers: Teacher[],
  etapasEnsino: EtapaEnsino[],
  options: EducacensoExportOptions = {},
): EducacensoExportResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validar dados
  const validation = validateExportData(schools, students, teachers, options)
  if (!validation.valid) {
    return {
      success: false,
      fileName: 'educacenso_export.txt',
      content: '',
      errors: validation.errors,
      warnings: validation.warnings,
    }
  }

  warnings.push(...validation.warnings)

  // Filtrar escolas
  const schoolsToExport = options.schoolId
    ? schools.filter((s) => s.id === options.schoolId)
    : schools

  if (schoolsToExport.length === 0) {
    return {
      success: false,
      fileName: 'educacenso_export.txt',
      content: '',
      errors: ['Nenhuma escola encontrada para exportação'],
    }
  }

  const lines: string[] = []
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')

  // Processar cada escola
  for (const school of schoolsToExport) {
    // Registro 00 - Dados da Escola
    lines.push(generateSchoolRecord(school))

    // Registro 40 - Infraestrutura (se solicitado)
    if (options.includeInfrastructure) {
      lines.push(generateInfrastructureRecord(school))
    }

    // Obter ano letivo
    const academicYears = school.academicYears || []
    const academicYear = options.academicYearId
      ? academicYears.find((y) => y.id === options.academicYearId)
      : academicYears.find((y) => y.status === 'active') || academicYears[0]

    if (!academicYear) {
      warnings.push(`Escola ${school.name} não possui ano letivo válido`)
      continue
    }

    // Registro 30 - Turmas (se solicitado)
    if (options.includeClassrooms) {
      const turmas = academicYear.turmas || []
      for (const turma of turmas) {
        const etapaEnsino = etapasEnsino.find((e) => e.id === turma.etapaEnsinoId)
        lines.push(generateClassroomRecord(turma, school, academicYear, etapaEnsino))
      }
    }

    // Registro 10 - Alunos (se solicitado)
    if (options.includeStudents) {
      const schoolEnrollments = students.flatMap((s) =>
        (s.enrollments || [])
          .filter((e) => e.schoolId === school.id && e.academicYearId === academicYear.id)
          .map((e) => ({ student: s, enrollment: e })),
      )

      for (const { student, enrollment } of schoolEnrollments) {
        const turma = (academicYear.turmas || []).find((t) => t.id === enrollment.classroomId)
        if (turma) {
          lines.push(generateStudentRecord(student, enrollment, school, academicYear, turma))
        } else {
          warnings.push(
            `Aluno ${student.name} matriculado em turma não encontrada`,
          )
        }
      }
    }

    // Registro 20 - Professores (se solicitado)
    if (options.includeTeachers) {
      const schoolTeachers = teachers.filter((t) => t.schoolId === school.id)
      for (const teacher of schoolTeachers) {
        const subjects = teacher.enabledSubjects || [teacher.subject || '']
        for (const subject of subjects) {
          if (subject) {
            lines.push(generateTeacherRecord(teacher, school, subject))
          }
        }
      }
    }
  }

  const content = lines.join('\n')
  const fileName = `educacenso_${timestamp}_${schoolsToExport.length}escolas.txt`

  return {
    success: true,
    fileName,
    content,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Faz download do arquivo Educacenso
 */
export function downloadEducacensoFile(
  result: EducacensoExportResult,
): void {
  if (!result.success || !result.content) {
    console.error('Erro ao gerar arquivo Educacenso:', result.errors)
    return
  }

  const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = result.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

