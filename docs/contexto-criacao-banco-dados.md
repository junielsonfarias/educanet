# Contexto para Criação da Estrutura do Banco de Dados - EduGestão Municipal

## 📋 Objetivo

Este documento fornece todo o contexto necessário para criar a estrutura completa do banco de dados no Supabase para o sistema **EduGestão Municipal** - um sistema de gestão escolar municipal integrado.

---

## 🎯 Visão Geral do Sistema

O EduGestão Municipal é um sistema completo de gestão educacional que gerencia:

- **Escolas municipais** e sua infraestrutura
- **Pessoas** (alunos, professores, funcionários)
- **Gestão Acadêmica** (cursos, turmas, notas, frequência)
- **Documentação escolar** (históricos, certificados, declarações)
- **Comunicação** (notificações, avisos)
- **Secretaria** (protocolos, atendimentos, filas)
- **Relatórios** e análises educacionais
- **Portal público** institucional
- **Integração com Educacenso/INEP**

---

## 🗂️ Estrutura de Entidades Principais

### 1. INSTITUIÇÃO E ESCOLAS

#### **1.1. institution (Instituição)**
Dados da Secretaria Municipal de Educação

**Campos:**
- `id` (UUID, PK)
- `name` (TEXT) - Nome da secretaria
- `cnpj` (TEXT, UNIQUE) - CNPJ
- `phone` (TEXT)
- `email` (TEXT)
- `address` (TEXT)
- `city` (TEXT)
- `state` (TEXT)
- `zip_code` (TEXT)
- `logo_url` (TEXT) - URL do logo
- `website` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **1.2. schools (Escolas)**
Escolas municipais

**Campos:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `inep_code` (TEXT, UNIQUE) - Código INEP
- `cnpj` (TEXT, UNIQUE)
- `type` (ENUM) - 'municipal', 'estadual', 'federal', 'privada'
- `modality` (TEXT[]) - ['infantil', 'fundamental_1', 'fundamental_2', 'medio', 'eja']
- `address` (TEXT)
- `neighborhood` (TEXT)
- `city` (TEXT)
- `state` (TEXT)
- `zip_code` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `director_id` (UUID, FK -> users)
- `total_students` (INTEGER)
- `total_teachers` (INTEGER)
- `total_classrooms` (INTEGER)
- `has_library` (BOOLEAN)
- `has_computer_lab` (BOOLEAN)
- `has_sports_court` (BOOLEAN)
- `has_cafeteria` (BOOLEAN)
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **1.3. classrooms (Salas de Aula)**
Salas físicas das escolas

**Campos:**
- `id` (UUID, PK)
- `school_id` (UUID, FK -> schools, NOT NULL)
- `name` (TEXT, NOT NULL)
- `capacity` (INTEGER)
- `has_projector` (BOOLEAN)
- `has_air_conditioning` (BOOLEAN)
- `has_accessibility` (BOOLEAN)
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 2. USUÁRIOS E PESSOAS

#### **2.1. users (Usuários do Sistema)**
Usuários com acesso ao painel administrativo

**Campos:**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE, NOT NULL)
- `password_hash` (TEXT, NOT NULL) - Hash bcrypt
- `name` (TEXT, NOT NULL)
- `role` (ENUM, NOT NULL) - 'admin', 'coordinator', 'director', 'secretary', 'teacher'
- `school_id` (UUID, FK -> schools) - NULL para admins e coordenadores
- `avatar_url` (TEXT)
- `active` (BOOLEAN, DEFAULT true)
- `last_login` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Índices:**
- `idx_users_email` em `email`
- `idx_users_role` em `role`
- `idx_users_school` em `school_id`

#### **2.2. students (Alunos)**
Dados dos estudantes

**Campos:**
- `id` (UUID, PK)
- `registration_number` (TEXT, UNIQUE, NOT NULL) - Matrícula
- `inep_code` (TEXT, UNIQUE) - Código INEP do aluno
- `full_name` (TEXT, NOT NULL)
- `cpf` (TEXT, UNIQUE)
- `rg` (TEXT)
- `birth_date` (DATE, NOT NULL)
- `gender` (ENUM) - 'M', 'F', 'other'
- `ethnicity` (TEXT)
- `special_needs` (TEXT[]) - Array de necessidades especiais
- `blood_type` (TEXT)
- `photo_url` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `neighborhood` (TEXT)
- `city` (TEXT)
- `state` (TEXT)
- `zip_code` (TEXT)
- `father_name` (TEXT)
- `mother_name` (TEXT)
- `guardian_name` (TEXT)
- `guardian_cpf` (TEXT)
- `guardian_phone` (TEXT, NOT NULL)
- `guardian_email` (TEXT)
- `emergency_contact` (TEXT)
- `emergency_phone` (TEXT)
- `sus_card` (TEXT) - Cartão do SUS
- `bolsa_familia` (BOOLEAN) - Recebe Bolsa Família
- `transport_type` (ENUM) - 'proprio', 'publico', 'escolar', 'a_pe'
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Índices:**
- `idx_students_registration` em `registration_number`
- `idx_students_cpf` em `cpf`
- `idx_students_name` em `full_name`

#### **2.3. teachers (Professores)**
Dados dos professores

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users, UNIQUE) - Pode ser NULL
- `registration_number` (TEXT, UNIQUE, NOT NULL)
- `inep_code` (TEXT, UNIQUE) - Código INEP do professor
- `full_name` (TEXT, NOT NULL)
- `cpf` (TEXT, UNIQUE, NOT NULL)
- `rg` (TEXT)
- `birth_date` (DATE, NOT NULL)
- `gender` (ENUM) - 'M', 'F', 'other'
- `email` (TEXT, NOT NULL)
- `phone` (TEXT, NOT NULL)
- `address` (TEXT)
- `city` (TEXT)
- `state` (TEXT)
- `zip_code` (TEXT)
- `education_level` (ENUM) - 'medio', 'superior', 'pos_graduacao', 'mestrado', 'doutorado'
- `specializations` (TEXT[]) - Especializações
- `subjects` (TEXT[]) - Disciplinas que leciona
- `hire_date` (DATE)
- `contract_type` (ENUM) - 'efetivo', 'temporario', 'terceirizado'
- `workload` (INTEGER) - Carga horária semanal
- `salary` (DECIMAL)
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **2.4. staff (Funcionários)**
Funcionários administrativos e de apoio

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users, UNIQUE) - Pode ser NULL
- `school_id` (UUID, FK -> schools)
- `registration_number` (TEXT, UNIQUE, NOT NULL)
- `full_name` (TEXT, NOT NULL)
- `cpf` (TEXT, UNIQUE, NOT NULL)
- `email` (TEXT)
- `phone` (TEXT)
- `role` (TEXT) - 'secretario', 'merendeira', 'zelador', 'auxiliar', etc.
- `hire_date` (DATE)
- `contract_type` (ENUM) - 'efetivo', 'temporario', 'terceirizado'
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 3. ESTRUTURA ACADÊMICA

#### **3.1. grades (Séries/Anos)**
Séries do ensino (1º ano, 2º ano, etc.)

**Campos:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL) - Ex: "1º Ano", "2º Ano"
- `stage` (ENUM, NOT NULL) - 'infantil', 'fundamental_1', 'fundamental_2', 'medio', 'eja'
- `order` (INTEGER) - Ordem de exibição
- `active` (BOOLEAN, DEFAULT true)

#### **3.2. subjects (Disciplinas)**

**Campos:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL) - Ex: "Matemática", "Português"
- `code` (TEXT, UNIQUE)
- `description` (TEXT)
- `workload` (INTEGER) - Carga horária
- `color` (TEXT) - Cor para UI
- `active` (BOOLEAN, DEFAULT true)

#### **3.3. classes (Turmas)**
Turmas específicas (Ex: "1º Ano A - 2025")

**Campos:**
- `id` (UUID, PK)
- `school_id` (UUID, FK -> schools, NOT NULL)
- `grade_id` (UUID, FK -> grades, NOT NULL)
- `classroom_id` (UUID, FK -> classrooms)
- `name` (TEXT, NOT NULL) - Ex: "1º Ano A"
- `year` (INTEGER, NOT NULL) - Ano letivo
- `shift` (ENUM) - 'matutino', 'vespertino', 'noturno', 'integral'
- `max_students` (INTEGER)
- `coordinator_teacher_id` (UUID, FK -> teachers)
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **3.4. enrollments (Matrículas)**
Matrículas de alunos em turmas

**Campos:**
- `id` (UUID, PK)
- `student_id` (UUID, FK -> students, NOT NULL)
- `class_id` (UUID, FK -> classes, NOT NULL)
- `enrollment_date` (DATE, NOT NULL)
- `status` (ENUM) - 'active', 'transferred', 'withdrawn', 'completed', 'pending'
- `transfer_reason` (TEXT)
- `withdrawal_date` (DATE)
- `final_result` (ENUM) - 'approved', 'failed', 'in_progress'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Unique constraint:** `(student_id, class_id)`

#### **3.5. class_subjects (Disciplinas da Turma)**
Associação de disciplinas com turmas

**Campos:**
- `id` (UUID, PK)
- `class_id` (UUID, FK -> classes, NOT NULL)
- `subject_id` (UUID, FK -> subjects, NOT NULL)
- `teacher_id` (UUID, FK -> teachers)
- `workload` (INTEGER) - Carga horária na turma
- `active` (BOOLEAN, DEFAULT true)

**Unique constraint:** `(class_id, subject_id)`

---

### 4. AVALIAÇÃO E FREQUÊNCIA

#### **4.1. assessment_types (Tipos de Avaliação)**
Tipos de avaliação (Prova, Trabalho, etc.)

**Campos:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL) - Ex: "Prova Bimestral", "Trabalho"
- `description` (TEXT)
- `weight` (DECIMAL) - Peso na média
- `active` (BOOLEAN, DEFAULT true)

#### **4.2. evaluation_rules (Regras de Avaliação)**
Regras de aprovação/reprovação

**Campos:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `grade_id` (UUID, FK -> grades)
- `min_approval_grade` (DECIMAL) - Nota mínima para aprovação
- `min_attendance` (DECIMAL) - Frequência mínima (%)
- `has_recovery` (BOOLEAN)
- `recovery_formula` (TEXT) - Fórmula de recuperação
- `active` (BOOLEAN, DEFAULT true)

#### **4.3. assessments (Avaliações)**
Avaliações aplicadas

**Campos:**
- `id` (UUID, PK)
- `class_subject_id` (UUID, FK -> class_subjects, NOT NULL)
- `assessment_type_id` (UUID, FK -> assessment_types, NOT NULL)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `date` (DATE, NOT NULL)
- `max_grade` (DECIMAL) - Nota máxima
- `weight` (DECIMAL) - Peso na média
- `period` (INTEGER) - Bimestre/Trimestre
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **4.4. grades_records (Notas)**
Notas dos alunos

**Campos:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK -> assessments, NOT NULL)
- `enrollment_id` (UUID, FK -> enrollments, NOT NULL)
- `grade` (DECIMAL) - Nota obtida
- `comments` (TEXT)
- `recorded_by` (UUID, FK -> users)
- `recorded_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Unique constraint:** `(assessment_id, enrollment_id)`

#### **4.5. attendance (Frequência)**
Registro de frequência diária

**Campos:**
- `id` (UUID, PK)
- `class_subject_id` (UUID, FK -> class_subjects, NOT NULL)
- `enrollment_id` (UUID, FK -> enrollments, NOT NULL)
- `date` (DATE, NOT NULL)
- `status` (ENUM) - 'present', 'absent', 'late', 'justified'
- `justification` (TEXT)
- `recorded_by` (UUID, FK -> users)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Unique constraint:** `(class_subject_id, enrollment_id, date)`

---

### 5. PLANEJAMENTO E DIÁRIO

#### **5.1. lesson_plans (Planos de Aula)**

**Campos:**
- `id` (UUID, PK)
- `class_subject_id` (UUID, FK -> class_subjects, NOT NULL)
- `date` (DATE, NOT NULL)
- `theme` (TEXT, NOT NULL)
- `objectives` (TEXT)
- `content` (TEXT)
- `methodology` (TEXT)
- `resources` (TEXT[])
- `evaluation` (TEXT)
- `observations` (TEXT)
- `bncc_codes` (TEXT[]) - Códigos BNCC
- `status` (ENUM) - 'draft', 'published', 'completed'
- `created_by` (UUID, FK -> users)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **5.2. class_council (Conselho de Classe)**

**Campos:**
- `id` (UUID, PK)
- `class_id` (UUID, FK -> classes, NOT NULL)
- `period` (INTEGER) - Bimestre/Trimestre
- `date` (DATE, NOT NULL)
- `participants` (UUID[]) - IDs dos participantes (teachers, staff)
- `general_observations` (TEXT)
- `decisions` (TEXT)
- `status` (ENUM) - 'scheduled', 'in_progress', 'completed'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **5.3. council_student_observations (Observações do Conselho)**

**Campos:**
- `id` (UUID, PK)
- `council_id` (UUID, FK -> class_council, NOT NULL)
- `enrollment_id` (UUID, FK -> enrollments, NOT NULL)
- `strengths` (TEXT) - Pontos fortes
- `challenges` (TEXT) - Desafios
- `interventions` (TEXT) - Intervenções propostas
- `decision` (TEXT) - Decisão do conselho
- `created_at` (TIMESTAMP)

---

### 6. TRANSFERÊNCIAS E MOVIMENTAÇÃO

#### **6.1. transfers (Transferências)**

**Campos:**
- `id` (UUID, PK)
- `student_id` (UUID, FK -> students, NOT NULL)
- `from_school_id` (UUID, FK -> schools)
- `to_school_id` (UUID, FK -> schools)
- `from_class_id` (UUID, FK -> classes)
- `to_class_id` (UUID, FK -> classes)
- `request_date` (DATE, NOT NULL)
- `transfer_date` (DATE)
- `reason` (TEXT)
- `type` (ENUM) - 'internal', 'external_in', 'external_out'
- `status` (ENUM) - 'pending', 'approved', 'completed', 'cancelled'
- `documents_generated` (BOOLEAN)
- `requested_by` (UUID, FK -> users)
- `approved_by` (UUID, FK -> users)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 7. DOCUMENTOS

#### **7.1. school_documents (Documentos Escolares)**

**Campos:**
- `id` (UUID, PK)
- `student_id` (UUID, FK -> students, NOT NULL)
- `type` (ENUM) - 'historico', 'declaracao_matricula', 'declaracao_transferencia', 'certificado', 'boletim', 'ata_resultados'
- `file_url` (TEXT) - URL do arquivo gerado
- `metadata` (JSONB) - Metadados do documento
- `generated_by` (UUID, FK -> users)
- `generated_at` (TIMESTAMP)

---

### 8. SECRETARIA E ATENDIMENTO

#### **8.1. protocols (Protocolos)**

**Campos:**
- `id` (UUID, PK)
- `protocol_number` (TEXT, UNIQUE, NOT NULL)
- `school_id` (UUID, FK -> schools)
- `requester_name` (TEXT, NOT NULL)
- `requester_cpf` (TEXT)
- `requester_phone` (TEXT)
- `requester_email` (TEXT)
- `subject` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `category` (ENUM) - 'documento', 'informacao', 'reclamacao', 'sugestao', 'outro'
- `priority` (ENUM) - 'baixa', 'media', 'alta', 'urgente'
- `status` (ENUM) - 'pendente', 'em_analise', 'em_andamento', 'resolvido', 'cancelado'
- `assigned_to` (UUID, FK -> users)
- `response` (TEXT)
- `attachments` (TEXT[]) - URLs de anexos
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `closed_at` (TIMESTAMP)

#### **8.2. service_queue (Fila de Atendimento)**

**Campos:**
- `id` (UUID, PK)
- `school_id` (UUID, FK -> schools, NOT NULL)
- `queue_number` (TEXT, NOT NULL) - Ex: "A001"
- `service_type` (ENUM) - 'matricula', 'documento', 'informacao', 'outro'
- `requester_name` (TEXT, NOT NULL)
- `requester_cpf` (TEXT)
- `priority` (BOOLEAN, DEFAULT false)
- `status` (ENUM) - 'waiting', 'in_service', 'completed', 'cancelled'
- `called_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)
- `attended_by` (UUID, FK -> users)
- `created_at` (TIMESTAMP)

#### **8.3. appointments (Agendamentos)**

**Campos:**
- `id` (UUID, PK)
- `school_id` (UUID, FK -> schools, NOT NULL)
- `requester_name` (TEXT, NOT NULL)
- `requester_phone` (TEXT, NOT NULL)
- `requester_email` (TEXT)
- `service_type` (TEXT, NOT NULL)
- `scheduled_date` (DATE, NOT NULL)
- `scheduled_time` (TIME, NOT NULL)
- `duration_minutes` (INTEGER)
- `notes` (TEXT)
- `status` (ENUM) - 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
- `assigned_to` (UUID, FK -> users)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 9. COMUNICAÇÃO

#### **9.1. notifications (Notificações)**

**Campos:**
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL)
- `message` (TEXT, NOT NULL)
- `type` (ENUM) - 'info', 'warning', 'alert', 'success'
- `target_type` (ENUM) - 'all', 'school', 'class', 'students', 'teachers', 'parents'
- `target_ids` (UUID[]) - IDs dos alvos específicos
- `school_id` (UUID, FK -> schools)
- `class_id` (UUID, FK -> classes)
- `send_email` (BOOLEAN, DEFAULT false)
- `send_sms` (BOOLEAN, DEFAULT false)
- `scheduled_for` (TIMESTAMP)
- `sent_at` (TIMESTAMP)
- `status` (ENUM) - 'draft', 'scheduled', 'sent', 'failed'
- `created_by` (UUID, FK -> users)
- `created_at` (TIMESTAMP)

#### **9.2. notification_templates (Templates de Notificação)**

**Campos:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `subject` (TEXT)
- `body` (TEXT, NOT NULL)
- `variables` (TEXT[]) - Variáveis disponíveis
- `type` (ENUM) - 'email', 'sms', 'both'
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)

---

### 10. CONTEÚDO PÚBLICO

#### **10.1. news (Notícias)**

**Campos:**
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL)
- `slug` (TEXT, UNIQUE, NOT NULL)
- `summary` (TEXT)
- `content` (TEXT, NOT NULL)
- `image_url` (TEXT)
- `author` (TEXT)
- `category` (TEXT)
- `published_at` (TIMESTAMP)
- `active` (BOOLEAN, DEFAULT true)
- `created_by` (UUID, FK -> users)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **10.2. public_documents (Documentos Públicos)**

**Campos:**
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `category` (ENUM) - 'legislacao', 'editais', 'relatorios', 'formularios', 'transparencia', 'outros'
- `file_url` (TEXT, NOT NULL)
- `file_size` (BIGINT)
- `file_type` (TEXT)
- `published_at` (DATE)
- `active` (BOOLEAN, DEFAULT true)
- `created_by` (UUID, FK -> users)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### **10.3. institutional_content (Conteúdo Institucional)**

**Campos:**
- `id` (UUID, PK)
- `section` (TEXT, UNIQUE, NOT NULL) - 'semed_info', 'semed_structure', etc.
- `title` (TEXT, NOT NULL)
- `content` (TEXT, NOT NULL)
- `metadata` (JSONB) - Dados adicionais
- `updated_at` (TIMESTAMP)

#### **10.4. hero_slides (Slides do Carrossel)**

**Campos:**
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL)
- `subtitle` (TEXT)
- `description` (TEXT)
- `image_url` (TEXT, NOT NULL)
- `button_text` (TEXT)
- `button_link` (TEXT)
- `order` (INTEGER)
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 11. CONFIGURAÇÕES E ALERTAS

#### **11.1. general_settings (Configurações Gerais)**

**Campos:**
- `id` (UUID, PK)
- `key` (TEXT, UNIQUE, NOT NULL)
- `value` (JSONB, NOT NULL)
- `description` (TEXT)
- `updated_at` (TIMESTAMP)

#### **11.2. alert_rules (Regras de Alertas)**

**Campos:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `type` (ENUM) - 'attendance', 'performance', 'behavior', 'enrollment'
- `condition` (JSONB) - Condição para disparo
- `threshold` (DECIMAL) - Limite
- `severity` (ENUM) - 'info', 'warning', 'critical'
- `notify_roles` (TEXT[]) - Roles a serem notificadas
- `active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)

#### **11.3. alert_instances (Instâncias de Alertas)**

**Campos:**
- `id` (UUID, PK)
- `alert_rule_id` (UUID, FK -> alert_rules, NOT NULL)
- `student_id` (UUID, FK -> students)
- `school_id` (UUID, FK -> schools)
- `class_id` (UUID, FK -> classes)
- `message` (TEXT, NOT NULL)
- `data` (JSONB) - Dados do alerta
- `status` (ENUM) - 'active', 'acknowledged', 'resolved'
- `acknowledged_by` (UUID, FK -> users)
- `resolved_by` (UUID, FK -> users)
- `created_at` (TIMESTAMP)
- `resolved_at` (TIMESTAMP)

---

### 12. PROJETOS E ATIVIDADES

#### **12.1. projects (Projetos)**

**Campos:**
- `id` (UUID, PK)
- `school_id` (UUID, FK -> schools)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `objectives` (TEXT)
- `start_date` (DATE)
- `end_date` (DATE)
- `coordinator_id` (UUID, FK -> teachers)
- `target_classes` (UUID[]) - IDs das turmas
- `status` (ENUM) - 'planning', 'active', 'completed', 'cancelled'
- `budget` (DECIMAL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 13. OCORRÊNCIAS

#### **13.1. occurrences (Ocorrências)**

**Campos:**
- `id` (UUID, PK)
- `student_id` (UUID, FK -> students, NOT NULL)
- `class_id` (UUID, FK -> classes, NOT NULL)
- `type` (ENUM) - 'disciplinar', 'pedagogica', 'saude', 'outro'
- `severity` (ENUM) - 'leve', 'moderada', 'grave'
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `date` (DATE, NOT NULL)
- `actions_taken` (TEXT)
- `requires_followup` (BOOLEAN)
- `followup_notes` (TEXT)
- `guardian_notified` (BOOLEAN)
- `reported_by` (UUID, FK -> users, NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## 🔐 Requisitos de Segurança (Row Level Security - RLS)

### Políticas Gerais

1. **Administradores (role: 'admin')**
   - Acesso total a todos os dados
   - CRUD completo em todas as tabelas

2. **Coordenadores (role: 'coordinator')**
   - Acesso a dados de todas as escolas
   - Leitura em todas as tabelas
   - Escrita limitada em algumas tabelas

3. **Diretores (role: 'director')**
   - Acesso apenas aos dados da sua escola (`school_id`)
   - Leitura e escrita na escola associada

4. **Secretários (role: 'secretary')**
   - Acesso apenas aos dados da sua escola
   - CRUD em: students, enrollments, protocols, appointments, queue

5. **Professores (role: 'teacher')**
   - Leitura de dados de suas turmas
   - Escrita em: grades_records, attendance, lesson_plans, occurrences

### Tabelas Públicas (sem autenticação)

- `news` (apenas leitura de ativos)
- `public_documents` (apenas leitura de ativos)
- `institutional_content` (apenas leitura)
- `hero_slides` (apenas leitura de ativos)

---

## 📊 Índices Importantes

### Índices de Performance

```sql
-- Buscas frequentes
CREATE INDEX idx_students_registration ON students(registration_number);
CREATE INDEX idx_students_cpf ON students(cpf);
CREATE INDEX idx_students_name ON students(full_name);
CREATE INDEX idx_students_active ON students(active);

CREATE INDEX idx_teachers_cpf ON teachers(cpf);
CREATE INDEX idx_teachers_active ON teachers(active);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_year ON classes(year);

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_enrollment ON attendance(enrollment_id);

CREATE INDEX idx_grades_enrollment ON grades_records(enrollment_id);
CREATE INDEX idx_grades_assessment ON grades_records(assessment_id);

-- Buscas por período
CREATE INDEX idx_assessments_date ON assessments(date);
CREATE INDEX idx_lesson_plans_date ON lesson_plans(date);
CREATE INDEX idx_protocols_created ON protocols(created_at);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for);
```

---

## 🔗 Relacionamentos Principais

```
schools (1) -> (N) classes
schools (1) -> (N) teachers (via allocation)
schools (1) -> (N) staff
schools (1) -> (1) users (director)

classes (1) -> (N) enrollments
classes (1) -> (N) class_subjects
classes (N) -> (1) grades

students (1) -> (N) enrollments
students (1) -> (N) transfers
students (1) -> (N) occurrences

teachers (1) -> (N) class_subjects
teachers (1) -> (N) lesson_plans

enrollments (1) -> (N) grades_records
enrollments (1) -> (N) attendance

class_subjects (1) -> (N) assessments
class_subjects (1) -> (N) attendance
class_subjects (1) -> (N) lesson_plans

assessments (1) -> (N) grades_records
```

---

## 📝 Dados de Referência (Enums)

### Estados Brasileiros
```
AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO
```

### Etapas de Ensino
```
infantil, fundamental_1, fundamental_2, medio, eja
```

### Turnos
```
matutino, vespertino, noturno, integral
```

### Tipos de Contrato
```
efetivo, temporario, terceirizado
```

### Níveis de Escolaridade
```
medio, superior, pos_graduacao, mestrado, doutorado
```

---

## 🎯 Prioridades de Implementação

### Alta Prioridade (Essencial)
1. users, schools
2. students, teachers, staff
3. grades, subjects, classes
4. enrollments, class_subjects
5. assessments, grades_records, attendance

### Média Prioridade (Importante)
6. evaluation_rules, assessment_types
7. lesson_plans
8. transfers
9. protocols, service_queue, appointments
10. occurrences

### Baixa Prioridade (Complementar)
11. notifications, notification_templates
12. news, public_documents, institutional_content
13. projects
14. alert_rules, alert_instances
15. class_council, council_student_observations
16. school_documents

---

## 📌 Observações Importantes

1. **UUIDs**: Usar UUID v4 para todas as chaves primárias
2. **Timestamps**: Sempre usar `TIMESTAMPTZ` (com timezone)
3. **Soft Deletes**: Usar campo `active` em vez de deletar fisicamente
4. **Auditoria**: Sempre manter `created_at` e `updated_at`
5. **Normalização**: Dados INEP devem estar normalizados e validados
6. **Cascata**: Definir `ON DELETE CASCADE` com cuidado
7. **Constraints**: Usar CHECK constraints para validações de domínio

---

## 🔄 Triggers Necessários

1. **updated_at**: Auto-atualizar campo `updated_at` em todas as tabelas
2. **enrollment_validation**: Validar capacidade da turma antes de matricular
3. **attendance_percentage**: Calcular percentual de frequência automaticamente
4. **alert_trigger**: Disparar alertas quando condições forem atingidas
5. **protocol_number**: Gerar número de protocolo automático

---

## 📖 Referências

- Arquivo de dados mock: `src/lib/mock-data.ts`
- Tipos TypeScript: `src/lib/mock-data.ts` (interfaces)
- Código INEP: https://www.gov.br/inep/
- BNCC: http://basenacionalcomum.mec.gov.br/

---

## ✅ Checklist de Criação

- [ ] Criar todas as tabelas na ordem de dependência
- [ ] Adicionar todas as foreign keys
- [ ] Criar índices de performance
- [ ] Configurar RLS (Row Level Security)
- [ ] Criar triggers de auditoria
- [ ] Criar views úteis (se necessário)
- [ ] Inserir dados de referência (enums)
- [ ] Gerar tipos TypeScript com Supabase CLI
- [ ] Testar políticas de segurança
- [ ] Documentar schema no Supabase Dashboard

---

**Data de criação:** 29/12/2025  
**Versão:** 1.0  
**Sistema:** EduGestão Municipal

