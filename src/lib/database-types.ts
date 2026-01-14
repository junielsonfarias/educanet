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
  // Propriedades de compatibilidade com modelo antigo
  name?: string; // Computado: person.first_name + ' ' + person.last_name
  registration?: string; // Alias para registration_number
  projectIds?: string[]; // Array vazio por padrão (projetos não implementados)
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
  school?: School;
  course: Course;
  academic_period: AcademicPeriod;
}

export interface EnrollmentWithDetails extends StudentEnrollment {
  student_profile: StudentFullInfo;
  school: School;
  course: Course;
  academic_year: AcademicYear;
}

// Types adicionais para dados do Supabase
export interface ClassTeacherSubject {
  id: number;
  class_id: number;
  teacher_id: number;
  subject_id: number;
  workload_hours?: number;
  teacher?: TeacherFullInfo;
  subject?: Subject;
}

export interface UserRole {
  id: number;
  user_id: string;
  role_id: number;
  role?: Role;
}

export interface AuthUser {
  id: string;
  email: string;
  person_id?: number;
  is_active: boolean;
  person?: Person;
  roles?: UserRole[];
}

export interface SettingRecord {
  id: number;
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  category?: string;
  description?: string;
}

export interface ProtocolRecord {
  id: number;
  protocol_number: string;
  requester_name: string;
  requester_email?: string;
  requester_phone?: string;
  subject: string;
  description: string;
  status: ProtocolStatus;
  priority?: string;
  school_id?: number;
  assigned_to?: number;
  school?: School;
}

export interface PublicContent {
  id: number;
  title: string;
  content: string;
  type: PortalContentType;
  status: PortalPublicationStatus;
  is_featured: boolean;
  published_at?: string;
  author_id?: number;
}

export interface SchoolDocument {
  id: number;
  document_number: string;
  document_type: SchoolDocumentType;
  title: string;
  content?: string;
  student_id?: number;
  school_id?: number;
  academic_year_id?: number;
}

export interface Communication {
  id: number;
  title: string;
  content: string;
  type: CommunicationType;
  sender_id?: number;
  school_id?: number;
  is_read: boolean;
}

// Tipo genérico para dados do Supabase (para callbacks)
export type SupabaseRecord = Record<string, unknown>;

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

