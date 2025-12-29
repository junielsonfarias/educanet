import { BaseDocumentGenerator, DocumentGeneratorOptions } from './base-generator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export class DeclaracaoMatriculaGenerator extends BaseDocumentGenerator {
  public generate(): void {
    this.addHeader()
    this.addTitle('DECLARAÇÃO DE MATRÍCULA')
    this.currentY += 10

    // Texto da declaração
    const { student, school, academicYear, classroom } = this.options
    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    const enrollmentDate = student.enrollments.find(
      (e) => e.schoolId === school.id && e.status === 'Cursando',
    )

    const declaracaoText = `
Declaramos para os devidos fins que ${student.name}, portador(a) do CPF ${student.cpf || 'não informado'}, está regularmente matriculado(a) nesta unidade escolar, no ano letivo de ${academicYear?.name || 'N/A'}, na ${classroom?.name || 'turma não informada'} (${classroom?.serieAnoName || 'série não informada'}), turno ${classroom?.shift || 'não informado'}.

Esta declaração é válida para o ano letivo de ${academicYear?.name || 'N/A'} e tem validade de 90 (noventa) dias a partir da data de emissão.

${school.address.split(',')[1]?.trim() || school.address}, ${currentDate}.
    `.trim()

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(declaracaoText, this.pageWidth - 2 * this.margin)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += lines.length * this.lineHeight + 15

    // Rodapé com assinatura
    this.addFooter()
  }
}

