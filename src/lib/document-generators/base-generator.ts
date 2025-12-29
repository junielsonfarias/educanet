import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type {
  Student,
  School,
  AnoLetivo,
  Turma,
  Assessment,
  AttendanceRecord,
  Period,
  Subject,
  EvaluationRule,
} from '../mock-data'

export interface DocumentGeneratorOptions {
  student: Student
  school: School
  academicYear?: AnoLetivo
  classroom?: Turma
  assessments?: Assessment[]
  attendanceRecords?: AttendanceRecord[]
  periods?: Period[]
  subjects?: Subject[]
  evaluationRule?: EvaluationRule
  directorName?: string
  generatedBy?: string
}

export class BaseDocumentGenerator {
  protected doc: jsPDF
  protected options: DocumentGeneratorOptions
  protected currentY: number = 20
  protected pageHeight: number = 297 // A4 height in mm
  protected pageWidth: number = 210 // A4 width in mm
  protected margin: number = 20
  protected lineHeight: number = 7

  constructor(options: DocumentGeneratorOptions) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    this.options = options
  }

  protected addHeader(): void {
    const { school } = this.options

    // Logo (se houver)
    if (school.logo) {
      // Em produção, carregaria a imagem real
      // this.doc.addImage(school.logo, 'PNG', this.margin, this.margin, 30, 20)
    }

    // Nome da escola
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(school.name, this.pageWidth / 2, this.currentY, {
      align: 'center',
    })

    this.currentY += 5

    // Endereço
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(school.address, this.pageWidth / 2, this.currentY, {
      align: 'center',
    })

    this.currentY += 3
    this.doc.text(
      `Telefone: ${school.phone} | INEP: ${school.inepCode || 'N/A'}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' },
    )

    this.currentY += 10
    this.addHorizontalLine()
    this.currentY += 5
  }

  protected addTitle(title: string): void {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.pageWidth / 2, this.currentY, {
      align: 'center',
    })
    this.currentY += 8
  }

  protected addSubtitle(subtitle: string): void {
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(subtitle, this.margin, this.currentY)
    this.currentY += 6
  }

  protected addText(text: string, fontSize: number = 10): void {
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += lines.length * this.lineHeight + 2
  }

  protected addHorizontalLine(): void {
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 3
  }

  protected addStudentInfo(): void {
    const { student } = this.options

    this.addSubtitle('DADOS DO ALUNO')

    const studentData = [
      ['Nome:', student.name],
      ['Registro:', student.registration],
      ['CPF:', student.cpf || 'Não informado'],
      ['Data de Nascimento:', student.birthDate ? format(new Date(student.birthDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Não informado'],
      ['Responsável:', student.guardian],
      ['Endereço:', `${student.address.street}, ${student.address.number} - ${student.address.neighborhood}`],
      ['Cidade/UF:', `${student.address.city}/${student.address.state}`],
      ['CEP:', student.address.zipCode],
      ['Telefone:', student.contacts.phone],
    ]

    studentData.forEach(([label, value]) => {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label, this.margin, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value || 'Não informado', this.margin + 50, this.currentY)
      this.currentY += this.lineHeight
    })

    this.currentY += 3
  }

  protected addFooter(protocolNumber?: string, sequentialNumber?: number): void {
    const { school, directorName } = this.options
    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    // Espaço para assinatura
    this.currentY = this.pageHeight - 60

    this.addHorizontalLine()

    // Data e local
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(
      `${school.address.split(',')[1]?.trim() || school.address}, ${currentDate}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' },
    )

    this.currentY += 15

    // Assinatura do diretor
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(
      directorName || school.director,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' },
    )

    this.currentY += 3
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Diretor(a)', this.pageWidth / 2, this.currentY, {
      align: 'center',
    })

    // Número de protocolo e sequencial (se houver)
    if (protocolNumber || sequentialNumber) {
      this.currentY += 10
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'italic')
      let footerText = ''
      if (protocolNumber) {
        footerText += `Protocolo: ${protocolNumber}`
      }
      if (sequentialNumber) {
        footerText += footerText ? ` | Nº Sequencial: ${sequentialNumber}` : `Nº Sequencial: ${sequentialNumber}`
      }
      this.doc.text(footerText, this.pageWidth / 2, this.currentY, {
        align: 'center',
      })
    }
  }

  protected checkNewPage(requiredSpace: number = 20): void {
    if (this.currentY + requiredSpace > this.pageHeight - 40) {
      this.doc.addPage()
      this.currentY = this.margin
    }
  }

  protected formatDate(date: string): string {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return date
    }
  }

  protected formatDateLong(date: string): string {
    try {
      return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return date
    }
  }

  public getPDF(): jsPDF {
    return this.doc
  }

  public getBlob(): Blob {
    return this.doc.output('blob')
  }

  public getDataUrl(): string {
    return this.doc.output('dataurlstring')
  }

  public save(filename: string): void {
    this.doc.save(filename)
  }
}

