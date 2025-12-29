export { BaseDocumentGenerator, type DocumentGeneratorOptions } from './base-generator'
export { HistoricoGenerator, type HistoricoGeneratorOptions } from './historico-generator'
export { DeclaracaoMatriculaGenerator } from './declaracao-matricula-generator'
export { FichaIndividualGenerator, type FichaIndividualOptions } from './ficha-individual-generator'
export { DeclaracaoTransferenciaGenerator, type DeclaracaoTransferenciaOptions } from './declaracao-transferencia-generator'
export { AtaResultadosGenerator, type AtaResultadosOptions } from './ata-resultados-generator'
export { CertificadoGenerator, type CertificadoOptions } from './certificado-generator'

// Função helper para gerar histórico escolar
export function generateHistoricoEscolar(
  options: HistoricoGeneratorOptions,
  protocolNumber?: string,
  sequentialNumber?: number,
): Blob {
  const generator = new HistoricoGenerator(options)
  generator.generate()
  
  // Adicionar informações de protocolo se fornecidas
  if (protocolNumber || sequentialNumber) {
    const doc = generator.getPDF()
    const pageCount = doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      let footerText = ''
      if (protocolNumber) {
        footerText += `Protocolo: ${protocolNumber}`
      }
      if (sequentialNumber) {
        footerText += footerText ? ` | Nº Sequencial: ${sequentialNumber}` : `Nº Sequencial: ${sequentialNumber}`
      }
      doc.text(footerText, doc.internal.pageSize.width / 2, pageHeight - 10, {
        align: 'center',
      })
    }
  }
  
  return generator.getBlob()
}

// Função helper para gerar declaração de matrícula
export function generateDeclaracaoMatricula(
  options: DocumentGeneratorOptions,
  protocolNumber?: string,
  sequentialNumber?: number,
): Blob {
  const generator = new DeclaracaoMatriculaGenerator(options)
  generator.generate()
  
  // Adicionar informações de protocolo se fornecidas
  if (protocolNumber || sequentialNumber) {
    const doc = generator.getPDF()
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    let footerText = ''
    if (protocolNumber) {
      footerText += `Protocolo: ${protocolNumber}`
    }
    if (sequentialNumber) {
      footerText += footerText ? ` | Nº Sequencial: ${sequentialNumber}` : `Nº Sequencial: ${sequentialNumber}`
    }
    doc.text(footerText, doc.internal.pageSize.width / 2, pageHeight - 10, {
      align: 'center',
    })
  }
  
  return generator.getBlob()
}

// Função helper para gerar ficha individual
export function generateFichaIndividual(
  options: FichaIndividualOptions,
  protocolNumber?: string,
  sequentialNumber?: number,
): Blob {
  const generator = new FichaIndividualGenerator(options)
  generator.generate()
  
  if (protocolNumber || sequentialNumber) {
    const doc = generator.getPDF()
    const pageCount = doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      let footerText = ''
      if (protocolNumber) {
        footerText += `Protocolo: ${protocolNumber}`
      }
      if (sequentialNumber) {
        footerText += footerText ? ` | Nº Sequencial: ${sequentialNumber}` : `Nº Sequencial: ${sequentialNumber}`
      }
      doc.text(footerText, doc.internal.pageSize.width / 2, pageHeight - 10, {
        align: 'center',
      })
    }
  }
  
  return generator.getBlob()
}

// Função helper para gerar declaração de transferência
export function generateDeclaracaoTransferencia(
  options: DeclaracaoTransferenciaOptions,
  protocolNumber?: string,
  sequentialNumber?: number,
): Blob {
  const generator = new DeclaracaoTransferenciaGenerator(options)
  generator.generate()
  
  if (protocolNumber || sequentialNumber) {
    const doc = generator.getPDF()
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    let footerText = ''
    if (protocolNumber) {
      footerText += `Protocolo: ${protocolNumber}`
    }
    if (sequentialNumber) {
      footerText += footerText ? ` | Nº Sequencial: ${sequentialNumber}` : `Nº Sequencial: ${sequentialNumber}`
    }
    doc.text(footerText, doc.internal.pageSize.width / 2, pageHeight - 10, {
      align: 'center',
    })
  }
  
  return generator.getBlob()
}

// Função helper para gerar ata de resultados
export function generateAtaResultados(
  options: AtaResultadosOptions,
  protocolNumber?: string,
  sequentialNumber?: number,
): Blob {
  const generator = new AtaResultadosGenerator(options)
  generator.generate()
  
  if (protocolNumber || sequentialNumber) {
    const doc = generator.getPDF()
    const pageCount = doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      let footerText = ''
      if (protocolNumber) {
        footerText += `Protocolo: ${protocolNumber}`
      }
      if (sequentialNumber) {
        footerText += footerText ? ` | Nº Sequencial: ${sequentialNumber}` : `Nº Sequencial: ${sequentialNumber}`
      }
      doc.text(footerText, doc.internal.pageSize.width / 2, pageHeight - 10, {
        align: 'center',
      })
    }
  }
  
  return generator.getBlob()
}

// Função helper para gerar certificado
export function generateCertificado(
  options: CertificadoOptions,
  protocolNumber?: string,
  sequentialNumber?: number,
): Blob {
  const generator = new CertificadoGenerator(options)
  generator.generate()
  
  if (protocolNumber || sequentialNumber) {
    const doc = generator.getPDF()
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    let footerText = ''
    if (protocolNumber) {
      footerText += `Protocolo: ${protocolNumber}`
    }
    if (sequentialNumber) {
      footerText += footerText ? ` | Nº Sequencial: ${sequentialNumber}` : `Nº Sequencial: ${sequentialNumber}`
    }
    doc.text(footerText, doc.internal.pageSize.width / 2, pageHeight - 10, {
      align: 'center',
    })
  }
  
  return generator.getBlob()
}

