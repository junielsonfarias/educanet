import { BaseDocumentGenerator, DocumentGeneratorOptions } from './base-generator'
import type {
  Assessment,
  AttendanceRecord,
  Period,
  Subject,
  EvaluationRule,
  EtapaEnsino,
  SerieAno,
} from '../mock-data'
import { calculateGrades } from '../grade-calculator'

export interface HistoricoGeneratorOptions extends DocumentGeneratorOptions {
  allEnrollments?: Array<{
    enrollmentId: string
    academicYearName: string
    gradeName: string
    className: string
    schoolName: string
    assessments: Assessment[]
    attendanceRecords: AttendanceRecord[]
    periods: Period[]
    subjects: Subject[]
    evaluationRule: EvaluationRule
  }>
}

export class HistoricoGenerator extends BaseDocumentGenerator {
  private allEnrollments: HistoricoGeneratorOptions['allEnrollments']

  constructor(options: HistoricoGeneratorOptions) {
    super(options)
    this.allEnrollments = options.allEnrollments || []
  }

  public generate(): void {
    this.addHeader()
    this.addTitle('HISTÓRICO ESCOLAR')
    this.currentY += 5

    // Informações do aluno
    this.addStudentInfo()
    this.currentY += 5

    // Histórico por ano letivo
    if (this.allEnrollments && this.allEnrollments.length > 0) {
      this.allEnrollments.forEach((enrollment, index) => {
        this.checkNewPage(100)
        this.addEnrollmentSection(enrollment, index + 1)
        this.currentY += 5
      })
    } else {
      this.addText('Nenhum histórico de matrícula encontrado.', 10)
    }

    // Rodapé
    this.addFooter()
  }

  private addEnrollmentSection(
    enrollment: HistoricoGeneratorOptions['allEnrollments'][0],
    sequence: number,
  ): void {
    this.addSubtitle(`${sequence}º ANO LETIVO - ${enrollment.academicYearName}`)

    // Informações da matrícula
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Escola: ${enrollment.schoolName}`, this.margin, this.currentY)
    this.currentY += this.lineHeight
    this.doc.text(`Série/Turma: ${enrollment.gradeName} - ${enrollment.className}`, this.margin, this.currentY)
    this.currentY += this.lineHeight + 3

    // Tabela de notas por disciplina
    if (enrollment.subjects && enrollment.subjects.length > 0) {
      this.addGradesTable(enrollment)
    }

    // Frequência
    this.currentY += 5
    this.addAttendanceInfo(enrollment.attendanceRecords, enrollment.periods)

    // Situação final
    this.currentY += 5
    this.addFinalStatus(enrollment)
  }

  private addGradesTable(enrollment: HistoricoGeneratorOptions['allEnrollments'][0]): void {
    const tableData: string[][] = []
    const headers = ['Disciplina', ...enrollment.periods.map((p) => p.name), 'Média Final', 'Situação']

    enrollment.subjects.forEach((subject) => {
      const subjectAssessments = enrollment.assessments.filter(
        (a) => a.subjectId === subject.id,
      )

      const calculation = calculateGrades(
        subjectAssessments,
        enrollment.evaluationRule,
        enrollment.periods,
        [], // assessmentTypes - pode ser passado se necessário
        enrollment.evaluationRule.recoveryStrategy || 'replace_if_higher',
      )

      const row: string[] = [subject.name]

      // Notas por período
      enrollment.periods.forEach((period) => {
        const periodResult = calculation.periodResults.find((pr) => pr.periodId === period.id)
        if (periodResult) {
          row.push(periodResult.finalPeriodGrade.toFixed(1))
        } else {
          row.push('-')
        }
      })

      // Média final
      row.push(calculation.finalGrade.toFixed(1))

      // Situação
      row.push(calculation.status)

      tableData.push(row)
    })

    // Adicionar tabela usando autoTable
    ;(this.doc as any).autoTable({
      head: [headers],
      body: tableData,
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

    // Atualizar posição Y após a tabela
    const finalY = (this.doc as any).lastAutoTable.finalY
    this.currentY = finalY ? finalY + 5 : this.currentY + 50
  }

  private addAttendanceInfo(
    attendanceRecords: AttendanceRecord[],
    periods: Period[],
  ): void {
    this.addSubtitle('FREQUÊNCIA')

    if (!attendanceRecords || attendanceRecords.length === 0) {
      this.addText('Nenhum registro de frequência encontrado.', 10)
      return
    }

    // Calcular frequência por período
    const attendanceData: string[][] = [['Período', 'Dias Letivos', 'Faltas', 'Frequência %']]

    periods.forEach((period) => {
      const periodRecords = attendanceRecords.filter(
        (r) =>
          new Date(r.date) >= new Date(period.startDate) &&
          new Date(r.date) <= new Date(period.endDate),
      )

      const totalDays = periodRecords.length
      const absences = periodRecords.filter((r) => !r.present).length
      const attendance = totalDays > 0 ? ((totalDays - absences) / totalDays) * 100 : 100

      attendanceData.push([
        period.name,
        totalDays.toString(),
        absences.toString(),
        `${attendance.toFixed(1)}%`,
      ])
    })

    // Frequência geral
    const totalDays = attendanceRecords.length
    const totalAbsences = attendanceRecords.filter((r) => !r.present).length
    const overallAttendance = totalDays > 0 ? ((totalDays - totalAbsences) / totalDays) * 100 : 100

    attendanceData.push([
      'TOTAL',
      totalDays.toString(),
      totalAbsences.toString(),
      `${overallAttendance.toFixed(1)}%`,
    ])

    ;(this.doc as any).autoTable({
      head: [attendanceData[0]],
      body: attendanceData.slice(1),
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
    })

    const finalY = (this.doc as any).lastAutoTable.finalY
    this.currentY = finalY ? finalY + 5 : this.currentY + 30
  }

  private addFinalStatus(enrollment: HistoricoGeneratorOptions['allEnrollments'][0]): void {
    this.addSubtitle('SITUAÇÃO FINAL')

    // Determinar situação geral baseada nas disciplinas
    let allApproved = true
    let hasDependency = false
    let hasFailed = false

    enrollment.subjects.forEach((subject) => {
      const subjectAssessments = enrollment.assessments.filter(
        (a) => a.subjectId === subject.id,
      )

      if (subjectAssessments.length > 0) {
        const calculation = calculateGrades(
          subjectAssessments,
          enrollment.evaluationRule,
          enrollment.periods,
          [],
          enrollment.evaluationRule.recoveryStrategy || 'replace_if_higher',
        )

        if (calculation.status === 'Reprovado') {
          hasFailed = true
          allApproved = false
        } else if (calculation.status === 'Dependência') {
          hasDependency = true
          allApproved = false
        }
      }
    })

    let finalStatus = 'Aprovado'
    if (hasFailed) {
      finalStatus = 'Reprovado'
    } else if (hasDependency) {
      finalStatus = 'Aprovado com Dependência'
    }

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(`Situação: ${finalStatus}`, this.margin, this.currentY)
    this.currentY += this.lineHeight + 3
  }
}

