import { BaseDocumentGenerator, DocumentGeneratorOptions } from './base-generator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Assessment, AttendanceRecord } from '../mock-data'

export interface FichaIndividualOptions extends DocumentGeneratorOptions {
  allEnrollments?: Array<{
    academicYearName: string
    gradeName: string
    className: string
    schoolName: string
    assessments: Assessment[]
    attendanceRecords: AttendanceRecord[]
    finalStatus: string
  }>
}

export class FichaIndividualGenerator extends BaseDocumentGenerator {
  private allEnrollments: FichaIndividualOptions['allEnrollments']

  constructor(options: FichaIndividualOptions) {
    super(options)
    this.allEnrollments = options.allEnrollments || []
  }

  public generate(): void {
    this.addHeader()
    this.addTitle('FICHA INDIVIDUAL DO ALUNO - CENSO ESCOLAR')
    this.currentY += 5

    // Dados pessoais completos
    this.addStudentInfoComplete()
    this.currentY += 5

    // Dados da família
    this.addFamilyInfo()
    this.currentY += 5

    // Dados de saúde
    this.addHealthInfo()
    this.currentY += 5

    // Histórico escolar
    if (this.allEnrollments && this.allEnrollments.length > 0) {
      this.addEnrollmentHistory()
      this.currentY += 5
    }

    // Dados de desempenho
    this.addPerformanceData()
    this.currentY += 5

    // Situação atual
    this.addCurrentStatus()

    // Rodapé
    this.addFooter()
  }

  private addStudentInfoComplete(): void {
    const { student } = this.options

    this.addSubtitle('DADOS PESSOAIS')

    const personalData = [
      ['Nome Completo:', student.name],
      ['Registro Escolar:', student.registration],
      ['CPF:', student.cpf || 'Não informado'],
      ['Data de Nascimento:', student.birthDate ? format(new Date(student.birthDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado'],
      ['Idade:', student.age ? `${student.age} anos` : 'Não informado'],
      ['Nacionalidade:', student.nationality || 'Brasileira'],
      ['País de Nascimento:', student.birthCountry || 'Brasil'],
      ['Raça/Cor:', student.raceColor || 'Não declarada'],
      ['Certidão de Nascimento:', student.birthCertificate || 'Não informado'],
      ['Cartão SUS:', student.susCard || 'Não informado'],
    ]

    personalData.forEach(([label, value]) => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label, this.margin, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value || 'Não informado', this.margin + 60, this.currentY)
      this.currentY += this.lineHeight
    })
  }

  private addFamilyInfo(): void {
    const { student } = this.options

    this.checkNewPage()
    this.addSubtitle('DADOS FAMILIARES')

    const familyData = [
      ['Responsável:', student.guardian],
      ['Nome do Pai:', student.fatherName || 'Não informado'],
      ['Nome da Mãe:', student.motherName || 'Não informado'],
      ['Escolaridade do Pai:', student.fatherEducation || 'Não informado'],
      ['Escolaridade da Mãe:', student.motherEducation || 'Não informado'],
      ['Telefone:', student.contacts.phone],
      ['E-mail:', student.contacts.email || 'Não informado'],
    ]

    familyData.forEach(([label, value]) => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label, this.margin, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value || 'Não informado', this.margin + 60, this.currentY)
      this.currentY += this.lineHeight
    })

    // Dados sociais
    this.currentY += 3
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('NIS:', this.margin, this.currentY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(student.social?.nis || 'Não informado', this.margin + 60, this.currentY)
    this.currentY += this.lineHeight
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Bolsa Família:', this.margin, this.currentY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(student.social?.bolsaFamilia ? 'Sim' : 'Não', this.margin + 60, this.currentY)
  }

  private addHealthInfo(): void {
    const { student } = this.options

    this.checkNewPage()
    this.addSubtitle('DADOS DE SAÚDE')

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Necessidades Especiais:', this.margin, this.currentY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(student.health?.hasSpecialNeeds ? 'Sim' : 'Não', this.margin + 60, this.currentY)
    this.currentY += this.lineHeight

    if (student.health?.hasSpecialNeeds) {
      if (student.health.cid) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('CID:', this.margin, this.currentY)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(student.health.cid, this.margin + 60, this.currentY)
        this.currentY += this.lineHeight
      }

      if (student.health.specialNeedsDetails && student.health.specialNeedsDetails.length > 0) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('Detalhes:', this.margin, this.currentY)
        this.currentY += this.lineHeight
        this.doc.setFont('helvetica', 'normal')
        student.health.specialNeedsDetails.forEach((detail) => {
          this.doc.text(`- ${detail}`, this.margin + 10, this.currentY)
          this.currentY += this.lineHeight
        })
      }

      if (student.health.observation) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('Observações:', this.margin, this.currentY)
        this.currentY += this.lineHeight
        this.doc.setFont('helvetica', 'normal')
        const lines = this.doc.splitTextToSize(student.health.observation, this.pageWidth - 2 * this.margin - 10)
        this.doc.text(lines, this.margin + 10, this.currentY)
        this.currentY += lines.length * this.lineHeight
      }
    }
  }

  private addEnrollmentHistory(): void {
    this.checkNewPage()
    this.addSubtitle('HISTÓRICO DE MATRÍCULAS')

    const tableData: string[][] = [
      ['Ano Letivo', 'Série/Turma', 'Escola', 'Situação Final'],
    ]

    this.allEnrollments?.forEach((enrollment) => {
      tableData.push([
        enrollment.academicYearName,
        `${enrollment.gradeName} - ${enrollment.className}`,
        enrollment.schoolName,
        enrollment.finalStatus,
      ])
    })

    ;(this.doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    })

    const finalY = (this.doc as any).lastAutoTable.finalY
    this.currentY = finalY ? finalY + 5 : this.currentY + 30
  }

  private addPerformanceData(): void {
    this.checkNewPage()
    this.addSubtitle('DADOS DE DESEMPENHO')

    if (!this.allEnrollments || this.allEnrollments.length === 0) {
      this.addText('Nenhum dado de desempenho disponível.', 10)
      return
    }

    // Resumo de desempenho por ano
    this.allEnrollments.forEach((enrollment) => {
      this.checkNewPage(40)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`${enrollment.academicYearName} - ${enrollment.gradeName}:`, this.margin, this.currentY)
      this.currentY += this.lineHeight

      // Total de avaliações
      const totalAssessments = enrollment.assessments.length
      const totalAttendance = enrollment.attendanceRecords.length
      const absences = enrollment.attendanceRecords.filter((r) => !r.present).length
      const attendanceRate = totalAttendance > 0 ? ((totalAttendance - absences) / totalAttendance) * 100 : 100

      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Total de avaliações: ${totalAssessments}`, this.margin + 10, this.currentY)
      this.currentY += this.lineHeight
      this.doc.text(`Frequência: ${attendanceRate.toFixed(1)}% (${totalAttendance - absences}/${totalAttendance} dias)`, this.margin + 10, this.currentY)
      this.currentY += this.lineHeight + 3
    })
  }

  private addCurrentStatus(): void {
    this.checkNewPage()
    this.addSubtitle('SITUAÇÃO ATUAL')

    const { student } = this.options
    const currentEnrollment = student.enrollments.find((e) => e.status === 'Cursando')

    if (currentEnrollment) {
      const currentYear = this.allEnrollments?.find(
        (e) => e.academicYearName === currentEnrollment.year.toString(),
      )

      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Status: ${currentEnrollment.status}`, this.margin, this.currentY)
      this.currentY += this.lineHeight

      if (currentYear) {
        this.doc.text(`Ano Letivo: ${currentYear.academicYearName}`, this.margin, this.currentY)
        this.currentY += this.lineHeight
        this.doc.text(`Série/Turma: ${currentYear.gradeName} - ${currentYear.className}`, this.margin, this.currentY)
        this.currentY += this.lineHeight
        this.doc.text(`Escola: ${currentYear.schoolName}`, this.margin, this.currentY)
      }
    } else {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('Aluno não possui matrícula ativa no momento.', this.margin, this.currentY)
    }
  }
}

