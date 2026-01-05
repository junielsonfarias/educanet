/**
 * Re-export de todos os tipos do banco de dados Supabase
 * 
 * Use este arquivo para importar types em vez de importar diretamente
 * de database.types.ts para facilitar manutenção futura.
 */

export type { Database, Json } from './supabase/database.types';
export type { Tables, Enums, TablesInsert, TablesUpdate } from './supabase/database.types';

// Types auxiliares para uso comum
export type Person = Tables<'people'>;
export type School = Tables<'schools'>;
export type Student = Tables<'student_profiles'>;
export type Teacher = Tables<'teachers'>;
export type Staff = Tables<'staff'>;
export type Guardian = Tables<'guardians'>;
export type AcademicYear = Tables<'academic_years'>;
export type AcademicPeriod = Tables<'academic_periods'>;
export type Course = Tables<'courses'>;
export type Subject = Tables<'subjects'>;
export type Class = Tables<'classes'>;
export type StudentEnrollment = Tables<'student_enrollments'>;
export type ClassEnrollment = Tables<'class_enrollments'>;
export type Grade = Tables<'grades'>;
export type Attendance = Tables<'attendances'>;
export type Role = Tables<'roles'>;
export type Permission = Tables<'permissions'>;
export type Position = Tables<'positions'>;
export type Department = Tables<'departments'>;
export type Infrastructure = Tables<'infrastructures'>;

// Types compostos (com JOINs)
export interface StudentFullInfo extends Student {
  person: Person;
  enrollments?: StudentEnrollment[];
  guardians?: Guardian[];
}

export interface TeacherFullInfo extends Teacher {
  person: Person;
  school?: School;
}

export interface StaffFullInfo extends Staff {
  person: Person;
  school?: School;
  position?: Position;
  department?: Department;
}

export interface ClassWithDetails extends Class {
  school: School;
  course: Course;
  academic_year: AcademicYear;
}

export interface EnrollmentWithDetails extends StudentEnrollment {
  student_profile: StudentFullInfo;
  school: School;
  course: Course;
  academic_year: AcademicYear;
}

// ENUMs
export type PersonType = Enums<'person_type'>;
export type StudentEnrollmentStatus = Enums<'student_enrollment_status'>;
export type EducationLevel = Enums<'education_level'>;
export type ClassEnrollmentStatus = Enums<'class_enrollment_status'>;
export type EvaluationType = Enums<'evaluation_type'>;
export type AttendanceStatus = Enums<'attendance_status'>;
export type AcademicPeriodType = Enums<'academic_period_type'>;
export type RelationshipType = Enums<'relationship_type'>;
export type PreferredContactMethod = Enums<'preferred_contact_method'>;
export type SchoolDocumentType = Enums<'school_document_type'>;
export type CommunicationType = Enums<'communication_type'>;
export type ProtocolStatus = Enums<'protocol_status'>;
export type PortalContentType = Enums<'portal_content_type'>;
export type PortalPublicationStatus = Enums<'portal_publication_status'>;

