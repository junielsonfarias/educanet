import { BaseDocumentGenerator, DocumentGeneratorOptions } from './base-generator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface DeclaracaoTransferenciaOptions extends DocumentGeneratorOptions {
  destinationSchool?: {
    name: string
    address: string
    inepCode?: string
  }
  transferReason?: string
  transferDate?: string
  dependencies?: Array<{
    subject: string
    grade: string
  }>
  pendingDocuments?: string[]
}

export class DeclaracaoTransferenciaGenerator extends BaseDocumentGenerator {
  private destinationSchool?: DeclaracaoTransferenciaOptions['destinationSchool']
  private transferReason?: string
  private transferDate?: string
  private dependencies?: Array<{ subject: string; grade: string }>
  private pendingDocuments?: string[]

  constructor(options: DeclaracaoTransferenciaOptions) {
    super(options)
    this.destinationSchool = options.destinationSchool
    this.transferReason = options.transferReason
    this.transferDate = options.transferDate
    this.dependencies = options.dependencies
    this.pendingDocuments = options.pendingDocuments
  }

  public generate(): void {
    this.addHeader()
    this.addTitle('DECLARAÇÃO DE TRANSFERÊNCIA')
    this.currentY += 10

    const { student, school, academicYear, classroom } = this.options
    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    const transferDate = this.transferDate
      ? format(new Date(this.transferDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : currentDate

    // Texto da declaração
    let declaracaoText = `
Declaramos para os devidos fins que ${student.name}, portador(a) do CPF ${student.cpf || 'não informado'}, registro escolar ${student.registration}, está sendo transferido(a) desta unidade escolar.

DADOS DA MATRÍCULA:
- Ano Letivo: ${academicYear?.name || 'N/A'}
- Série/Turma: ${classroom?.serieAnoName || 'N/A'} - ${classroom?.name || 'N/A'}
- Turno: ${classroom?.shift || 'N/A'}
- Data de Matrícula: ${student.enrollments.find((e) => e.schoolId === school.id) ? format(new Date(student.enrollments[0].createdAt || new Date()), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
- Data de Transferência: ${transferDate}
    `.trim()

    if (this.destinationSchool) {
      declaracaoText += `\n\nESCOLA DE DESTINO:\n- Nome: ${this.destinationSchool.name}\n- Endereço: ${this.destinationSchool.address}\n- INEP: ${this.destinationSchool.inepCode || 'N/A'}`
    }

    if (this.transferReason) {
      declaracaoText += `\n\nMOTIVO DA TRANSFERÊNCIA:\n${this.transferReason}`
    }

    // Pendências
    if (this.dependencies && this.dependencies.length > 0) {
      declaracaoText += `\n\nDEPENDÊNCIAS:\n`
      this.dependencies.forEach((dep) => {
        declaracaoText += `- ${dep.subject} (${dep.grade})\n`
      })
    }

    if (this.pendingDocuments && this.pendingDocuments.length > 0) {
      declaracaoText += `\n\nDOCUMENTOS PENDENTES:\n`
      this.pendingDocuments.forEach((doc) => {
        declaracaoText += `- ${doc}\n`
      })
    }

    declaracaoText += `\n\nEsta declaração é válida por 90 (noventa) dias a partir da data de emissão.\n\n${school.address.split(',')[1]?.trim() || school.address}, ${currentDate}.`

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(declaracaoText, this.pageWidth - 2 * this.margin)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += lines.length * this.lineHeight + 15

    // Rodapé com assinatura
    this.addFooter()
  }
}

