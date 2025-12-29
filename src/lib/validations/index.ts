/**
 * Validações INEP - Exportações principais
 */

// CPF/CNPJ
export {
  validateCPF,
  validateCNPJ,
  validateCPForCNPJ,
  formatCPF,
  formatCNPJ,
  type ValidationResult,
} from './cpf-cnpj-validator'

// Códigos INEP
export {
  validateSchoolINEPCode,
  validateEtapaEnsinoCode,
  validateModalidadeCode,
  validateTipoRegimeCode,
  getEtapaEnsinoName,
  getModalidadeName,
  getTipoRegimeName,
  ETAPA_ENSINO_CODES,
  MODALIDADE_CODES,
  TIPO_REGIME_CODES,
  type INEPCodeValidationResult,
} from './inep-code-validator'

// Idade vs Série
export {
  calculateAge,
  validateAgeGrade,
  calculateAgeGradeDistortion,
  hasAgeGradeDistortion,
  AGE_RULES_BY_GRADE,
  type AgeGradeValidationResult,
} from './age-grade-validator'

// Matrículas
export {
  validateDuplicateEnrollment,
  validateSimultaneousEnrollments,
  validateEnrollmentRelationships,
  validateClassroomCapacity,
  validateEnrollmentPeriod,
  validateEnrollmentComplete,
  type EnrollmentValidationResult,
} from './enrollment-validator'

// Datas
export {
  validateDateFormat,
  validateDateLogic,
  validateAcademicPeriod,
  validateDateInPeriod,
  validateAgeCutoffDate,
  validateNotFutureDate,
  validateNotTooOldDate,
  validateDateComplete,
  type DateValidationResult,
} from './date-validator'

// Campos Obrigatórios
export {
  validateStudentRequiredFields,
  validateTeacherRequiredFields,
  validateSchoolRequiredFields,
  validateTurmaRequiredFields,
  validateEtapaEnsinoRequiredFields,
  validateRequiredFields,
  type RequiredFieldsValidationResult,
} from './required-fields-validator'

// Relacionamentos
export {
  validateTurmaBelongsToSchool,
  validateTurmaBelongsToAcademicYear,
  validateSerieAnoBelongsToEtapaEnsino,
  validateSubjectBelongsToSerieAno,
  validateTeacherEnabledForSubject,
  validateStudentInCorrectGrade,
  validateAssessmentBelongsToClassroomAndSubject,
  validateTurmaRelationships,
  type RelationshipValidationResult,
} from './relationship-validator'

