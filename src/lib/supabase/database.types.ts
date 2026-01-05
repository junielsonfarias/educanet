/**
 * TYPES GERADOS AUTOMATICAMENTE DO BANCO SUPABASE
 * 
 * ⚠️ NÃO EDITE ESTE ARQUIVO MANUALMENTE
 * 
 * Para regenerar:
 * 1. Pelo MCP: Use a função generate_typescript_types
 * 2. Manualmente: npx supabase gen types typescript --project-id "seu-project-id"
 * 
 * Última geração: 2025-12-29
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          academic_year_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          end_date: string
          id: number
          name: string
          start_date: string
          type: Database["public"]["Enums"]["academic_period_type"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          academic_year_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          end_date: string
          id?: number
          name: string
          start_date: string
          type: Database["public"]["Enums"]["academic_period_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          academic_year_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          end_date?: string
          id?: number
          name?: string
          start_date?: string
          type?: Database["public"]["Enums"]["academic_period_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_periods_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          end_date: string
          id: number
          start_date: string
          updated_at: string
          updated_by: number | null
          year: number
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          end_date: string
          id?: number
          start_date: string
          updated_at?: string
          updated_by?: number | null
          year: number
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          end_date?: string
          id?: number
          start_date?: string
          updated_at?: string
          updated_by?: number | null
          year?: number
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          file_name: string
          file_path_url: string
          file_size_bytes: number | null
          file_type: string
          id: number
          updated_at: string
          updated_by: number | null
          uploaded_at: string
          uploaded_by_id: number
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          file_name: string
          file_path_url: string
          file_size_bytes?: number | null
          file_type: string
          id?: number
          updated_at?: string
          updated_by?: number | null
          uploaded_at?: string
          uploaded_by_id: number
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          entity_id?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          file_name?: string
          file_path_url?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: number
          updated_at?: string
          updated_by?: number | null
          uploaded_at?: string
          uploaded_by_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          lesson_id: number
          status: Database["public"]["Enums"]["attendance_status"]
          student_enrollment_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          lesson_id: number
          status: Database["public"]["Enums"]["attendance_status"]
          student_enrollment_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          lesson_id?: number
          status?: Database["public"]["Enums"]["attendance_status"]
          student_enrollment_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendances_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_enrollment_id_fkey"
            columns: ["student_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          last_login: string | null
          person_id: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          person_id?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          person_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_users_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          enrollment_date: string
          id: number
          status: Database["public"]["Enums"]["class_enrollment_status"]
          student_enrollment_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          class_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          enrollment_date?: string
          id?: number
          status?: Database["public"]["Enums"]["class_enrollment_status"]
          student_enrollment_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          class_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          enrollment_date?: string
          id?: number
          status?: Database["public"]["Enums"]["class_enrollment_status"]
          student_enrollment_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_enrollment_id_fkey"
            columns: ["student_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teacher_subjects: {
        Row: {
          class_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          subject_id: number
          teacher_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          class_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          subject_id: number
          teacher_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          class_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          subject_id?: number
          teacher_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_teacher_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_period_id: number
          course_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          homeroom_teacher_id: number | null
          id: number
          name: string
          school_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          academic_period_id: number
          course_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          homeroom_teacher_id?: number | null
          id?: number
          name: string
          school_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          academic_period_id?: number
          course_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          homeroom_teacher_id?: number | null
          id?: number
          name?: string
          school_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_period_id_fkey"
            columns: ["academic_period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_homeroom_teacher_id_fkey"
            columns: ["homeroom_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_recipients: {
        Row: {
          communication_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          person_id: number
          read_date: string | null
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          communication_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          person_id: number
          read_date?: string | null
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          communication_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          person_id?: number
          read_date?: string | null
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_recipients_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_recipients_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          message: string
          send_date: string
          sender_id: number
          title: string
          type: Database["public"]["Enums"]["communication_type"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          message: string
          send_date?: string
          sender_id: number
          title: string
          type: Database["public"]["Enums"]["communication_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          message?: string
          send_date?: string
          sender_id?: number
          title?: string
          type?: Database["public"]["Enums"]["communication_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      course_subjects: {
        Row: {
          course_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          subject_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          course_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          subject_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          course_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          subject_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          duration_months: number | null
          education_level: Database["public"]["Enums"]["education_level"]
          id: number
          name: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          education_level: Database["public"]["Enums"]["education_level"]
          id?: number
          name: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          education_level?: Database["public"]["Enums"]["education_level"]
          id?: number
          name?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      disciplinary_actions: {
        Row: {
          action_date: string
          action_type: Database["public"]["Enums"]["disciplinary_action_type"]
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          student_incident_id: number
          taken_by_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          action_date?: string
          action_type: Database["public"]["Enums"]["disciplinary_action_type"]
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          student_incident_id: number
          taken_by_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          action_date?: string
          action_type?: Database["public"]["Enums"]["disciplinary_action_type"]
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          student_incident_id?: number
          taken_by_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_actions_student_incident_id_fkey"
            columns: ["student_incident_id"]
            isOneToOne: false
            referencedRelation: "student_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_taken_by_id_fkey"
            columns: ["taken_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_instances: {
        Row: {
          class_teacher_subject_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          evaluation_date: string
          evaluation_type: Database["public"]["Enums"]["evaluation_type"]
          id: number
          max_grade: number
          title: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          class_teacher_subject_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          evaluation_date: string
          evaluation_type: Database["public"]["Enums"]["evaluation_type"]
          id?: number
          max_grade?: number
          title: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          class_teacher_subject_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          evaluation_date?: string
          evaluation_type?: Database["public"]["Enums"]["evaluation_type"]
          id?: number
          max_grade?: number
          title?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_instances_class_teacher_subject_id_fkey"
            columns: ["class_teacher_subject_id"]
            isOneToOne: false
            referencedRelation: "class_teacher_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          attendance_status: string | null
          created_at: string
          created_by: number
          deleted_at: string | null
          event_id: number
          id: number
          person_id: number
          registration_date: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          attendance_status?: string | null
          created_at?: string
          created_by: number
          deleted_at?: string | null
          event_id: number
          id?: number
          person_id: number
          registration_date?: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          attendance_status?: string | null
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          event_id?: number
          id?: number
          person_id?: number
          registration_date?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "school_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          component_name: string
          created_at: string
          created_by: number
          deleted_at: string | null
          evaluation_instance_id: number
          grade_value: number
          id: number
          release_date: string
          student_enrollment_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          component_name?: string
          created_at?: string
          created_by: number
          deleted_at?: string | null
          evaluation_instance_id: number
          grade_value: number
          id?: number
          release_date?: string
          student_enrollment_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          component_name?: string
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          evaluation_instance_id?: number
          grade_value?: number
          id?: number
          release_date?: string
          student_enrollment_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_evaluation_instance_id_fkey"
            columns: ["evaluation_instance_id"]
            isOneToOne: false
            referencedRelation: "evaluation_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_enrollment_id_fkey"
            columns: ["student_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          is_emergency_contact: boolean
          person_id: number
          preferred_contact_method: Database["public"]["Enums"]["preferred_contact_method"]
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          is_emergency_contact?: boolean
          person_id: number
          preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"]
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          is_emergency_contact?: boolean
          person_id?: number
          preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"]
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_types: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          name: string
          severity_level: Database["public"]["Enums"]["incident_severity_level"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name: string
          severity_level: Database["public"]["Enums"]["incident_severity_level"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name?: string
          severity_level?: Database["public"]["Enums"]["incident_severity_level"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          incident_date: string
          incident_type_id: number
          reported_by_id: number
          resolution_status: Database["public"]["Enums"]["incident_resolution_status"]
          school_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          incident_date?: string
          incident_type_id: number
          reported_by_id: number
          resolution_status?: Database["public"]["Enums"]["incident_resolution_status"]
          school_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          incident_date?: string
          incident_type_id?: number
          reported_by_id?: number
          resolution_status?: Database["public"]["Enums"]["incident_resolution_status"]
          school_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_incident_type_id_fkey"
            columns: ["incident_type_id"]
            isOneToOne: false
            referencedRelation: "incident_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reported_by_id_fkey"
            columns: ["reported_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructures: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          quantity: number
          school_id: number
          type: Database["public"]["Enums"]["infrastructure_type"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          quantity?: number
          school_id: number
          type: Database["public"]["Enums"]["infrastructure_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          quantity?: number
          school_id?: number
          type?: Database["public"]["Enums"]["infrastructure_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "infrastructures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          class_teacher_subject_id: number
          content: string | null
          created_at: string
          created_by: number
          deleted_at: string | null
          end_time: string
          id: number
          lesson_date: string
          start_time: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          class_teacher_subject_id: number
          content?: string | null
          created_at?: string
          created_by: number
          deleted_at?: string | null
          end_time: string
          id?: number
          lesson_date: string
          start_time: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          class_teacher_subject_id?: number
          content?: string | null
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          end_time?: string
          id?: number
          lesson_date?: string
          start_time?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_class_teacher_subject_id_fkey"
            columns: ["class_teacher_subject_id"]
            isOneToOne: false
            referencedRelation: "class_teacher_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          address: string | null
          cpf: string
          created_at: string
          created_by: number
          date_of_birth: string
          deleted_at: string | null
          email: string | null
          first_name: string
          id: number
          last_name: string
          phone: string | null
          rg: string | null
          type: Database["public"]["Enums"]["person_type"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          address?: string | null
          cpf: string
          created_at?: string
          created_by: number
          date_of_birth: string
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: number
          last_name: string
          phone?: string | null
          rg?: string | null
          type: Database["public"]["Enums"]["person_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          address?: string | null
          cpf?: string
          created_at?: string
          created_by?: number
          date_of_birth?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: number
          last_name?: string
          phone?: string | null
          rg?: string | null
          type?: Database["public"]["Enums"]["person_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      professional_development_programs: {
        Row: {
          cost: number | null
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: number
          name: string
          organizer: string | null
          start_date: string
          type: Database["public"]["Enums"]["professional_development_type"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name: string
          organizer?: string | null
          start_date: string
          type: Database["public"]["Enums"]["professional_development_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name?: string
          organizer?: string | null
          start_date?: string
          type?: Database["public"]["Enums"]["professional_development_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      protocol_status_history: {
        Row: {
          change_date: string
          changed_by_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          new_status: Database["public"]["Enums"]["protocol_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["protocol_status"] | null
          protocol_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          change_date?: string
          changed_by_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          new_status: Database["public"]["Enums"]["protocol_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["protocol_status"] | null
          protocol_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          change_date?: string
          changed_by_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          new_status?: Database["public"]["Enums"]["protocol_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["protocol_status"] | null
          protocol_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_status_history_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_status_history_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "secretariat_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      public_portal_content: {
        Row: {
          author_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          publication_date: string
          publication_status: Database["public"]["Enums"]["portal_publication_status"]
          title: string
          type: Database["public"]["Enums"]["portal_content_type"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          author_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          publication_date?: string
          publication_status?: Database["public"]["Enums"]["portal_publication_status"]
          title: string
          type: Database["public"]["Enums"]["portal_content_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          author_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          publication_date?: string
          publication_status?: Database["public"]["Enums"]["portal_publication_status"]
          title?: string
          type?: Database["public"]["Enums"]["portal_content_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_portal_content_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      public_portal_content_versions: {
        Row: {
          content: string
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          public_portal_content_id: number
          updated_at: string
          updated_by: number | null
          version_date: string
          version_number: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          public_portal_content_id: number
          updated_at?: string
          updated_by?: number | null
          version_date?: string
          version_number: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          public_portal_content_id?: number
          updated_at?: string
          updated_by?: number | null
          version_date?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_portal_content_versions_public_portal_content_id_fkey"
            columns: ["public_portal_content_id"]
            isOneToOne: false
            referencedRelation: "public_portal_content"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          permission_id: number
          role_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          permission_id: number
          role_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          permission_id?: number
          role_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: number
          default_for_person_type:
            | Database["public"]["Enums"]["person_type"]
            | null
          deleted_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          default_for_person_type?:
            | Database["public"]["Enums"]["person_type"]
            | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          default_for_person_type?:
            | Database["public"]["Enums"]["person_type"]
            | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      school_documents: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          issue_date: string
          student_enrollment_id: number
          type: Database["public"]["Enums"]["school_document_type"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          issue_date?: string
          student_enrollment_id: number
          type: Database["public"]["Enums"]["school_document_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          issue_date?: string
          student_enrollment_id?: number
          type?: Database["public"]["Enums"]["school_document_type"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "school_documents_student_enrollment_id_fkey"
            columns: ["student_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      school_documents_versions: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          file_path: string
          id: number
          school_document_id: number
          updated_at: string
          updated_by: number | null
          version_date: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          file_path: string
          id?: number
          school_document_id: number
          updated_at?: string
          updated_by?: number | null
          version_date?: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          file_path?: string
          id?: number
          school_document_id?: number
          updated_at?: string
          updated_by?: number | null
          version_date?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "school_documents_versions_school_document_id_fkey"
            columns: ["school_document_id"]
            isOneToOne: false
            referencedRelation: "school_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      school_events: {
        Row: {
          audience: Database["public"]["Enums"]["event_audience"]
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          end_date_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: number
          location: string | null
          organizer_id: number
          school_id: number | null
          start_date_time: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          audience: Database["public"]["Enums"]["event_audience"]
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          end_date_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: number
          location?: string | null
          organizer_id: number
          school_id?: number | null
          start_date_time: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          audience?: Database["public"]["Enums"]["event_audience"]
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          end_date_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: number
          location?: string | null
          organizer_id?: number
          school_id?: number | null
          start_date_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "school_events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string
          cnpj: string | null
          created_at: string
          created_by: number
          deleted_at: string | null
          email: string | null
          id: number
          inep_code: string | null
          name: string
          phone: string | null
          student_capacity: number | null
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          address: string
          cnpj?: string | null
          created_at?: string
          created_by: number
          deleted_at?: string | null
          email?: string | null
          id?: number
          inep_code?: string | null
          name: string
          phone?: string | null
          student_capacity?: number | null
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          address?: string
          cnpj?: string | null
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          email?: string | null
          id?: number
          inep_code?: string | null
          name?: string
          phone?: string | null
          student_capacity?: number | null
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      secretariat_protocols: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          observations: string | null
          opening_date: string
          protocol_number: string
          request_type: Database["public"]["Enums"]["secretariat_request_type"]
          requester_id: number
          status: Database["public"]["Enums"]["protocol_status"]
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          observations?: string | null
          opening_date?: string
          protocol_number: string
          request_type: Database["public"]["Enums"]["secretariat_request_type"]
          requester_id: number
          status?: Database["public"]["Enums"]["protocol_status"]
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          observations?: string | null
          opening_date?: string
          protocol_number?: string
          request_type?: Database["public"]["Enums"]["secretariat_request_type"]
          requester_id?: number
          status?: Database["public"]["Enums"]["protocol_status"]
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "secretariat_protocols_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      secretariat_services: {
        Row: {
          attended_by_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          notes: string | null
          protocol_id: number
          service_date: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          attended_by_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          notes?: string | null
          protocol_id: number
          service_date?: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          attended_by_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          notes?: string | null
          protocol_id?: number
          service_date?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "secretariat_services_attended_by_id_fkey"
            columns: ["attended_by_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretariat_services_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "secretariat_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          department_id: number
          functional_registration: string
          id: number
          person_id: number
          position_id: number
          school_id: number | null
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          department_id: number
          functional_registration: string
          id?: number
          person_id: number
          position_id: number
          school_id?: number | null
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          department_id?: number
          functional_registration?: string
          id?: number
          person_id?: number
          position_id?: number
          school_id?: number | null
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          enrollment_date: string
          enrollment_number: string
          enrollment_status: Database["public"]["Enums"]["student_enrollment_status"]
          id: number
          school_id: number
          student_profile_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          academic_year_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          enrollment_date?: string
          enrollment_number: string
          enrollment_status?: Database["public"]["Enums"]["student_enrollment_status"]
          id?: number
          school_id: number
          student_profile_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          academic_year_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          enrollment_date?: string
          enrollment_number?: string
          enrollment_status?: Database["public"]["Enums"]["student_enrollment_status"]
          id?: number
          school_id?: number
          student_profile_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          guardian_id: number
          id: number
          is_primary_contact: boolean
          student_profile_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          guardian_id: number
          id?: number
          is_primary_contact?: boolean
          student_profile_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          guardian_id?: number
          id?: number
          is_primary_contact?: boolean
          student_profile_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_incidents: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          incident_id: number
          role_in_incident: Database["public"]["Enums"]["student_incident_role"]
          student_profile_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          incident_id: number
          role_in_incident: Database["public"]["Enums"]["student_incident_role"]
          student_profile_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          incident_id?: number
          role_in_incident?: Database["public"]["Enums"]["student_incident_role"]
          student_profile_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_incidents_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_incidents_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          person_id: number
          student_registration_number: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          person_id: number
          student_registration_number: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          person_id?: number
          student_registration_number?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      student_status_history: {
        Row: {
          change_date: string
          changed_by_id: number
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          new_status: Database["public"]["Enums"]["student_enrollment_status"]
          note: string | null
          old_status:
            | Database["public"]["Enums"]["student_enrollment_status"]
            | null
          student_enrollment_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          change_date?: string
          changed_by_id: number
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          new_status: Database["public"]["Enums"]["student_enrollment_status"]
          note?: string | null
          old_status?:
            | Database["public"]["Enums"]["student_enrollment_status"]
            | null
          student_enrollment_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          change_date?: string
          changed_by_id?: number
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          new_status?: Database["public"]["Enums"]["student_enrollment_status"]
          note?: string | null
          old_status?:
            | Database["public"]["Enums"]["student_enrollment_status"]
            | null
          student_enrollment_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_status_history_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_status_history_student_enrollment_id_fkey"
            columns: ["student_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          description: string | null
          id: number
          setting_key: string
          setting_value: string | null
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          setting_key: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          description?: string | null
          id?: number
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: []
      }
      teacher_certifications: {
        Row: {
          certification_name: string
          created_at: string
          created_by: number
          deleted_at: string | null
          expiry_date: string | null
          id: number
          issue_date: string
          issuing_body: string | null
          teacher_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          certification_name: string
          created_at?: string
          created_by: number
          deleted_at?: string | null
          expiry_date?: string | null
          id?: number
          issue_date: string
          issuing_body?: string | null
          teacher_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          certification_name?: string
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          expiry_date?: string | null
          id?: number
          issue_date?: string
          issuing_body?: string | null
          teacher_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_certifications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_pd_enrollments: {
        Row: {
          completion_date: string | null
          created_at: string
          created_by: number
          deleted_at: string | null
          enrollment_date: string
          grade_or_feedback: string | null
          id: number
          program_id: number
          status: Database["public"]["Enums"]["professional_development_status"]
          teacher_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          created_by: number
          deleted_at?: string | null
          enrollment_date?: string
          grade_or_feedback?: string | null
          id?: number
          program_id: number
          status?: Database["public"]["Enums"]["professional_development_status"]
          teacher_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          enrollment_date?: string
          grade_or_feedback?: string | null
          id?: number
          program_id?: number
          status?: Database["public"]["Enums"]["professional_development_status"]
          teacher_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_pd_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "professional_development_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_pd_enrollments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          functional_registration: string
          id: number
          person_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          functional_registration: string
          id?: number
          person_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          functional_registration?: string
          id?: number
          person_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: number
          deleted_at: string | null
          id: number
          person_id: number
          role_id: number
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          created_at?: string
          created_by: number
          deleted_at?: string | null
          id?: number
          person_id: number
          role_id: number
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number
          deleted_at?: string | null
          id?: number
          person_id?: number
          role_id?: number
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_is_admin: { Args: { check_user_id: string }; Returns: boolean }
      get_user_person_id: { Args: { check_user_id: string }; Returns: number }
      get_user_role: { Args: { user_id: string }; Returns: string }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      academic_period_type: "Semestre" | "Trimestre" | "Bimestre"
      attendance_status:
        | "Presente"
        | "Falta Justificada"
        | "Falta Injustificada"
      class_enrollment_status: "Ativo" | "Concluido" | "Evadido"
      communication_type: "Notificacao" | "Aviso" | "Comunicado"
      disciplinary_action_type:
        | "Advertencia"
        | "Suspensao"
        | "Reuniao com Responsaveis"
        | "Servico Comunitario"
      education_level:
        | "Educação Infantil"
        | "Ensino Fundamental I"
        | "Ensino Fundamental II"
        | "Ensino Médio"
        | "EJA"
      entity_type:
        | "school"
        | "infrastructure"
        | "person"
        | "student_profile"
        | "guardian"
        | "student_enrollment"
        | "teacher"
        | "position"
        | "department"
        | "staff"
        | "academic_year"
        | "academic_period"
        | "course"
        | "subject"
        | "class"
        | "lesson"
        | "evaluation_instance"
        | "grade"
        | "attendance"
        | "school_document"
        | "communication"
        | "secretariat_protocol"
        | "public_portal_content"
        | "system_setting"
        | "role"
        | "permission"
        | "incident_type"
        | "incident"
        | "disciplinary_action"
        | "school_event"
        | "professional_development_program"
        | "teacher_certification"
      evaluation_type:
        | "Prova"
        | "Trabalho"
        | "Participacao"
        | "Recuperacao"
        | "Outro"
      event_audience:
        | "Alunos"
        | "Professores"
        | "Funcionarios"
        | "Pais"
        | "Comunidade"
        | "Todos"
      event_status: "Confirmado" | "Cancelado" | "Adiado"
      event_type:
        | "Academico"
        | "Esportivo"
        | "Cultural"
        | "Feriado"
        | "Reuniao"
        | "Outro"
      incident_resolution_status: "Pendente" | "Resolvido" | "Escalado"
      incident_severity_level: "Baixa" | "Media" | "Alta"
      infrastructure_type:
        | "Sala de Aula"
        | "Laboratorio"
        | "Biblioteca"
        | "Quadra"
        | "Auditorio"
        | "Refeitorio"
        | "Secretaria"
        | "Outro"
      person_type: "Aluno" | "Professor" | "Funcionario"
      portal_content_type:
        | "Noticia"
        | "Evento"
        | "Pagina Institucional"
        | "Comunicado"
      portal_publication_status: "Rascunho" | "Publicado" | "Arquivado"
      preferred_contact_method: "Telefone" | "Email" | "Ambos"
      professional_development_status:
        | "Planejado"
        | "Inscrito"
        | "Concluido"
        | "Cancelado"
      professional_development_type:
        | "Curso"
        | "Workshop"
        | "Conferencia"
        | "Certificacao"
        | "Outro"
      protocol_status: "Aberto" | "Em Andamento" | "Concluido" | "Cancelado"
      relationship_type: "Pai" | "Mae" | "Tutor Legal" | "Outro"
      school_document_type:
        | "Historico Escolar"
        | "Certificado"
        | "Declaracao"
        | "Atestado"
      secretariat_request_type:
        | "Matricula"
        | "Transferencia"
        | "Documento"
        | "Informacao"
        | "Outro"
      student_enrollment_status:
        | "Ativo"
        | "Inativo"
        | "Transferido"
        | "Concluido"
        | "Evadido"
      student_incident_role: "Vitima" | "Agente" | "Testemunha"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
