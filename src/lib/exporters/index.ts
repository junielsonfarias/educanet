/**
 * Exportadores - Exportações principais
 */

// Exportador Educacenso
export {
  exportEducacenso,
  downloadEducacensoFile,
  type EducacensoExportOptions,
  type EducacensoExportResult,
} from './educacenso-exporter'

// Relatório de Inconsistências
export {
  generateInconsistencyReport,
  exportInconsistencyReportToCSV,
  downloadInconsistencyReport,
  type Inconsistency,
  type InconsistencyReport,
} from './inconsistencies-reporter'

