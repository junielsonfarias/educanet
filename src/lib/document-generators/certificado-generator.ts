import { BaseDocumentGenerator, DocumentGeneratorOptions } from './base-generator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface CertificadoOptions extends DocumentGeneratorOptions {
  completionDate?: string
  courseName?: string
  finalGrade?: number
}

export class CertificadoGenerator extends BaseDocumentGenerator {
  private completionDate?: string
  private courseName?: string
  private finalGrade?: number

  constructor(options: CertificadoOptions) {
    super(options)
    this.completionDate = options.completionDate
    this.courseName = options.courseName
    this.finalGrade = options.finalGrade
  }

  public generate(): void {
    const { student, school, academicYear, classroom } = this.options
    const completionDate = this.completionDate
      ? format(new Date(this.completionDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    // Cabeçalho decorativo
    this.doc.setFillColor(66, 139, 202)
    this.doc.rect(0, 0, this.pageWidth, 50, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('CERTIFICADO', this.pageWidth / 2, 25, { align: 'center' })
    this.doc.setTextColor(0, 0, 0)

    this.currentY = 70

    // Texto do certificado
    const certificadoText = `
Certificamos que ${student.name}, portador(a) do CPF ${student.cpf || 'não informado'}, registro escolar ${student.registration}, concluiu com aproveitamento o ${this.courseName || classroom?.serieAnoName || 'curso'} na ${school.name}, no ano letivo de ${academicYear?.name || 'N/A'}, turma ${classroom?.name || 'N/A'}, turno ${classroom?.shift || 'N/A'}.

${this.finalGrade ? `Média final: ${this.finalGrade.toFixed(1)}` : ''}

Para os devidos fins, apresentamos este certificado.

${school.address.split(',')[1]?.trim() || school.address}, ${completionDate}.
    `.trim()

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(certificadoText, this.pageWidth - 2 * this.margin)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += lines.length * this.lineHeight + 20

    // Assinatura do diretor
    this.addFooter()
  }
}

