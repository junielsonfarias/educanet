-- =====================================================
-- FASE 2: CRIAÇÃO DO BANCO DE DADOS
-- MIGRATION 002: CRIAR TODOS OS ENUMS
-- =====================================================

-- 1. Incident Severity Level
-- =====================================================
CREATE TYPE incident_severity_level AS ENUM (
  'Baixa',
  'Media',
  'Alta'
);

-- 2. Incident Resolution Status
-- =====================================================
CREATE TYPE incident_resolution_status AS ENUM (
  'Pendente',
  'Resolvido',
  'Escalado'
);

-- 3. Student Incident Role
-- =====================================================
CREATE TYPE student_incident_role AS ENUM (
  'Vitima',
  'Agente',
  'Testemunha'
);

-- 4. Disciplinary Action Type
-- =====================================================
CREATE TYPE disciplinary_action_type AS ENUM (
  'Advertencia',
  'Suspensao',
  'Reuniao com Responsaveis',
  'Servico Comunitario'
);

-- 5. Infrastructure Type
-- =====================================================
CREATE TYPE infrastructure_type AS ENUM (
  'Sala de Aula',
  'Laboratorio',
  'Biblioteca',
  'Quadra',
  'Auditorio',
  'Refeitorio',
  'Secretaria',
  'Outro'
);

-- 6. Person Type
-- =====================================================
CREATE TYPE person_type AS ENUM (
  'Aluno',
  'Professor',
  'Funcionario'
);

-- 7. Student Enrollment Status
-- =====================================================
CREATE TYPE student_enrollment_status AS ENUM (
  'Ativo',
  'Inativo',
  'Transferido',
  'Concluido',
  'Evadido'
);

-- 8. Education Level
-- =====================================================
CREATE TYPE education_level AS ENUM (
  'Educação Infantil',
  'Ensino Fundamental I',
  'Ensino Fundamental II',
  'Ensino Médio',
  'EJA'
);

-- 9. Class Enrollment Status
-- =====================================================
CREATE TYPE class_enrollment_status AS ENUM (
  'Ativo',
  'Concluido',
  'Evadido'
);

-- 10. Evaluation Type
-- =====================================================
CREATE TYPE evaluation_type AS ENUM (
  'Prova',
  'Trabalho',
  'Participacao',
  'Recuperacao',
  'Outro'
);

-- 11. Attendance Status
-- =====================================================
CREATE TYPE attendance_status AS ENUM (
  'Presente',
  'Falta Justificada',
  'Falta Injustificada'
);

-- 12. School Document Type
-- =====================================================
CREATE TYPE school_document_type AS ENUM (
  'Historico Escolar',
  'Certificado',
  'Declaracao',
  'Atestado'
);

-- 13. Communication Type
-- =====================================================
CREATE TYPE communication_type AS ENUM (
  'Notificacao',
  'Aviso',
  'Comunicado'
);

-- 14. Protocol Status
-- =====================================================
CREATE TYPE protocol_status AS ENUM (
  'Aberto',
  'Em Andamento',
  'Concluido',
  'Cancelado'
);

-- 15. Secretariat Request Type
-- =====================================================
CREATE TYPE secretariat_request_type AS ENUM (
  'Matricula',
  'Transferencia',
  'Documento',
  'Informacao',
  'Outro'
);

-- 16. Portal Content Type
-- =====================================================
CREATE TYPE portal_content_type AS ENUM (
  'Noticia',
  'Evento',
  'Pagina Institucional',
  'Comunicado'
);

-- 17. Portal Publication Status
-- =====================================================
CREATE TYPE portal_publication_status AS ENUM (
  'Rascunho',
  'Publicado',
  'Arquivado'
);

-- 18. Academic Period Type
-- =====================================================
CREATE TYPE academic_period_type AS ENUM (
  'Semestre',
  'Trimestre',
  'Bimestre'
);

-- 19. Relationship Type
-- =====================================================
CREATE TYPE relationship_type AS ENUM (
  'Pai',
  'Mae',
  'Tutor Legal',
  'Outro'
);

-- 20. Preferred Contact Method
-- =====================================================
CREATE TYPE preferred_contact_method AS ENUM (
  'Telefone',
  'Email',
  'Ambos'
);

-- 21. Event Type
-- =====================================================
CREATE TYPE event_type AS ENUM (
  'Academico',
  'Esportivo',
  'Cultural',
  'Feriado',
  'Reuniao',
  'Outro'
);

-- 22. Event Audience
-- =====================================================
CREATE TYPE event_audience AS ENUM (
  'Alunos',
  'Professores',
  'Funcionarios',
  'Pais',
  'Comunidade',
  'Todos'
);

-- 23. Event Status
-- =====================================================
CREATE TYPE event_status AS ENUM (
  'Confirmado',
  'Cancelado',
  'Adiado'
);

-- 24. Professional Development Type
-- =====================================================
CREATE TYPE professional_development_type AS ENUM (
  'Curso',
  'Workshop',
  'Conferencia',
  'Certificacao',
  'Outro'
);

-- 25. Professional Development Status
-- =====================================================
CREATE TYPE professional_development_status AS ENUM (
  'Planejado',
  'Inscrito',
  'Concluido',
  'Cancelado'
);

-- 26. Entity Type
-- =====================================================
CREATE TYPE entity_type AS ENUM (
  'school',
  'infrastructure',
  'person',
  'student_profile',
  'guardian',
  'student_enrollment',
  'teacher',
  'position',
  'department',
  'staff',
  'academic_year',
  'academic_period',
  'course',
  'subject',
  'class',
  'lesson',
  'evaluation_instance',
  'grade',
  'attendance',
  'school_document',
  'communication',
  'secretariat_protocol',
  'public_portal_content',
  'system_setting',
  'role',
  'permission',
  'incident_type',
  'incident',
  'disciplinary_action',
  'school_event',
  'professional_development_program',
  'teacher_certification'
);

-- =====================================================
-- VERIFICAÇÃO DOS ENUMS CRIADOS
-- =====================================================

-- Query para listar todos os ENUMs criados
-- SELECT n.nspname as schema, t.typname as type_name
-- FROM pg_type t
-- LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
-- WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = t.typrelid))
-- AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid)
-- AND n.nspname NOT IN ('pg_catalog', 'information_schema')
-- ORDER BY schema, type_name;

-- =====================================================
-- FIM DA CRIAÇÃO DOS ENUMS
-- Total: 26 tipos ENUM criados
-- =====================================================

