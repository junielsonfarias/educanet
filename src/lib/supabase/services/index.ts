/**
 * Services Index - Export centralizado de todos os services
 * 
 * Import único para facilitar o uso:
 * import { studentService, schoolService, ... } from '@/lib/supabase/services'
 */

// Base
export { BaseService } from './base-service';
export type { PaginationParams, SortParams, FilterParams, QueryResult } from './base-service';

// Import services para uso no default export
import { studentService } from './student-service';
import { schoolService } from './school-service';
import { teacherService } from './teacher-service';
import { classService } from './class-service';
import { enrollmentService } from './enrollment-service';
import { gradeService } from './grade-service';
import { attendanceService } from './attendance-service';
import { documentService } from './document-service';
import { communicationService } from './communication-service';
import { protocolService } from './protocol-service';
import { publicContentService } from './public-content-service';
import { courseService, subjectService } from './course-service';
import { settingsService } from './settings-service';
import { attachmentService } from './attachment-service';
import { academicYearService } from './academic-year-service';
import { academicPeriodService } from './academic-period-service';
import { evaluationInstanceService } from './evaluation-instance-service';
import { lessonService } from './lesson-service';
import { staffService } from './staff-service';
import { authUserService } from './auth-user-service';
import { personService } from './person-service';
import { transferService } from './transfer-service';
import { preEnrollmentService } from './pre-enrollment-service';
import { reenrollmentService } from './reenrollment-service';
import { evaluationRulesService } from './evaluation-rules-service';
import { assessmentTypeService } from './assessment-type-service';

// Services Específicos - Re-export
export { studentService } from './student-service';
export { schoolService } from './school-service';
export { teacherService } from './teacher-service';
export { classService } from './class-service';
export { enrollmentService } from './enrollment-service';
export { gradeService } from './grade-service';
export { attendanceService } from './attendance-service';
export { documentService } from './document-service';
export { communicationService } from './communication-service';
export { protocolService } from './protocol-service';
export { publicContentService } from './public-content-service';
export { courseService, subjectService } from './course-service';
export { settingsService } from './settings-service';
export { attachmentService } from './attachment-service';
export { academicYearService } from './academic-year-service';
export { academicPeriodService } from './academic-period-service';
export { evaluationInstanceService } from './evaluation-instance-service';
export { lessonService } from './lesson-service';
export { staffService } from './staff-service';
export { authUserService } from './auth-user-service';
export { personService } from './person-service';
export { transferService } from './transfer-service';
export { preEnrollmentService } from './pre-enrollment-service';
export { reenrollmentService } from './reenrollment-service';
export { evaluationRulesService } from './evaluation-rules-service';
export { assessmentTypeService } from './assessment-type-service';

// Types específicos dos services
export type { EnrollmentData, TransferData } from './enrollment-service';
export type { GradeData, StudentGradesSummary } from './grade-service';
export type { AttendanceData, AttendanceStats } from './attendance-service';
export type { ClassStats, ClassWithFullInfo } from './class-service';
export type { SchoolStats, SchoolWithStats } from './school-service';
export type { DocumentData } from './document-service';
export type { CommunicationData } from './communication-service';
export type { ProtocolData } from './protocol-service';
export type { PublicContentData } from './public-content-service';
export type { CourseData, SubjectData } from './course-service';
export type { SettingsData } from './settings-service';
export type { AttachmentData, AttachmentWithDetails, EntityType } from './attachment-service';
export type { AcademicYearWithPeriods } from './academic-year-service';
export type { AcademicPeriodWithYear } from './academic-period-service';
export type { EvaluationInstanceWithDetails } from './evaluation-instance-service';
export type { LessonWithDetails } from './lesson-service';
export type { StaffFullInfo } from './staff-service';
export type { AuthUserFullInfo } from './auth-user-service';
export type {
  Transfer,
  TransferWithDetails,
  TransferStatus,
  TransferType,
  SolicitarTransferenciaData,
  TransferenciaExternaSaidaData
} from './transfer-service';
export type {
  PreEnrollment,
  PreEnrollmentWithDetails,
  PreEnrollmentPeriod,
  PreEnrollmentStatus,
  PreEnrollmentType,
  PreEnrollmentSchoolChoice,
  SchoolVacancy,
  SchoolCoverageArea,
  CriarPreMatriculaData,
  AcompanhamentoPreMatricula
} from './pre-enrollment-service';
export type {
  ReenrollmentBatch,
  ReenrollmentBatchWithDetails,
  ReenrollmentItem,
  ReenrollmentItemWithDetails,
  ReenrollmentStatus,
  ReenrollmentItemStatus,
  StudentFinalResult,
  EducationGrade,
  SchoolEducationLevel,
  PreviaRematricula,
  ResultadoExecucao
} from './reenrollment-service';
export type { EvaluationRule, EvaluationRuleFormData } from './evaluation-rules-service';
export type { AssessmentType, AssessmentTypeCreateData, AssessmentTypeUpdateData } from './assessment-type-service';

// Default exports
export default {
  studentService,
  schoolService,
  teacherService,
  classService,
  enrollmentService,
  gradeService,
  attendanceService,
  documentService,
  communicationService,
  protocolService,
  publicContentService,
  courseService,
  subjectService,
  settingsService,
  attachmentService,
  academicYearService,
  academicPeriodService,
  evaluationInstanceService,
  lessonService,
  staffService,
  authUserService,
  personService,
  transferService,
  preEnrollmentService,
  reenrollmentService,
  evaluationRulesService,
  assessmentTypeService
};

