import { BaseDocumentGenerator } from './base-generator'
import type { Student, School, AnoLetivo, Turma } from '../mock-data'
import { calculateGrades } from '../grade-calculator'
import type { Assessment, Period, Subject, EvaluationRule } from '../mock-data'

export interface AtaResultadosOptions {
  school: School
  academicYear: AnoLetivo
  classroom: Turma
  students: Array<{
    student: Student
    assessments: Assessment[]
    attendanceRecords: Array<{ present: boolean }>
  }>
  periods: Period[]
  subjects: Subject[]
  evaluationRule: EvaluationRule
  councilMembers?: string[]
  councilDate?: string
}

export class AtaResultadosGenerator extends BaseDocumentGenerator {
  private options: AtaResultadosOptions

  constructor(options: AtaResultadosOptions) {
    super({
      student: options.students[0]?.student || ({} as any),
      school: options.school,
      academicYear: options.academicYear,
      classroom: options.classroom,
    })
    this.options = options
  }

  public generate(): void {
    this.addHeader()
    this.addTitle('ATA DE RESULTADOS FINAIS')
    this.currentY += 5

    // Informações da turma
    this.addClassroomInfo()
    this.currentY += 5

    // Lista de alunos com resultados
    this.addStudentsResults()
    this.currentY += 10

    // Assinaturas do conselho
    this.addCouncilSignatures()

    // Rodapé
    this.addFooter()
  }

  private addClassroomInfo(): void {
    const { academicYear, classroom, school } = this.options

    this.addSubtitle('DADOS DA TURMA')

    const classData = [
      ['Escola:', school.name],
      ['Ano Letivo:', academicYear.name],
      ['Série/Turma:', `${classroom.serieAnoName || ''} - ${classroom.name}`],
      ['Turno:', classroom.shift],
      ['Total de Alunos:', this.options.students.length.toString()],
    ]

    classData.forEach(([label, value]) => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label, this.margin, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value, this.margin + 50, this.currentY)
      this.currentY += this.lineHeight
    })
  }

  private addStudentsResults(): void {
    this.checkNewPage(100)
    this.addSubtitle('RESULTADOS POR ALUNO')

    const tableData: string[][] = [
      ['Nº', 'Nome do Aluno', 'Registro', 'Média Geral', 'Frequência %', 'Situação Final'],
    ]

    this.options.students.forEach((studentData, index) => {
      const { student, assessments, attendanceRecords } = studentData

      // Calcular média geral
      let totalGrade = 0
      let subjectCount = 0

      this.options.subjects.forEach((subject) => {
        const subjectAssessments = assessments.filter((a) => a.subjectId === subject.id)
        if (subjectAssessments.length > 0) {
          const calculation = calculateGrades(
            subjectAssessments,
            this.options.evaluationRule,
            this.options.periods,
            [],
            this.options.evaluationRule.recoveryStrategy || 'replace_if_higher',
          )
          totalGrade += calculation.finalGrade
          subjectCount++
        }
      })

      const averageGrade = subjectCount > 0 ? totalGrade / subjectCount : 0

      // Calcular frequência
      const totalDays = attendanceRecords.length
      const absences = attendanceRecords.filter((r) => !r.present).length
      const attendanceRate = totalDays > 0 ? ((totalDays - absences) / totalDays) * 100 : 100

      // Determinar situação
      let finalStatus = 'Aprovado'
      if (averageGrade < this.options.evaluationRule.passingGrade!) {
        finalStatus = 'Reprovado'
      } else if (attendanceRate < (this.options.evaluationRule.minAttendance || 75)) {
        finalStatus = 'Reprovado por Frequência'
      }

      tableData.push([
        (index + 1).toString(),
        student.name,
        student.registration,
        averageGrade.toFixed(1),
        `${attendanceRate.toFixed(1)}%`,
        finalStatus,
      ])
    })

    ;(this.doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 8 },
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
    this.currentY = finalY ? finalY + 5 : this.currentY + 50
  }

  private addCouncilSignatures(): void {
    this.checkNewPage(60)
    this.addSubtitle('ASSINATURAS DO CONSELHO DE CLASSE')

    const councilDate = this.options.councilDate
      ? this.formatDateLong(this.options.councilDate)
      : this.formatDateLong(new Date().toISOString())

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Data da Reunião: ${councilDate}`, this.margin, this.currentY)
    this.currentY += 10

    if (this.options.councilMembers && this.options.councilMembers.length > 0) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Membros do Conselho:', this.margin, this.currentY)
      this.currentY += 8

      this.options.councilMembers.forEach((member, index) => {
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(`${index + 1}. ${member}`, this.margin + 10, this.currentY)
        this.currentY += 15

        // Linha para assinatura
        this.doc.setLineWidth(0.5)
        this.doc.line(this.margin + 10, this.currentY, this.pageWidth - this.margin - 10, this.currentY)
        this.currentY += 5
      })
    } else {
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('Assinaturas:', this.margin, this.currentY)
      this.currentY += 15

      // Espaços para assinaturas
      for (let i = 0; i < 3; i++) {
        this.doc.setLineWidth(0.5)
        this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
        this.currentY += 15
      }
    }
  }
}

