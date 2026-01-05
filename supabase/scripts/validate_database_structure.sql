-- =====================================================
-- SCRIPT DE VALIDAÇÃO DA ESTRUTURA DO BANCO
-- =====================================================
-- Este script valida a estrutura do banco de dados,
-- verificando tabelas, colunas, índices, constraints,
-- triggers, views e funções.
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TABELAS PRINCIPAIS
-- =====================================================
DO $$
DECLARE
  v_missing_tables TEXT[];
  v_required_tables TEXT[] := ARRAY[
    'people',
    'schools',
    'student_profiles',
    'teacher_profiles',
    'classes',
    'student_enrollments',
    'class_enrollments',
    'subjects',
    'courses',
    'academic_years',
    'academic_periods',
    'grades',
    'evaluation_instances',
    'lessons',
    'attendances',
    'roles',
    'permissions',
    'auth_users',
    'system_settings'
  ];
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY v_required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = v_table
    ) THEN
      v_missing_tables := array_append(v_missing_tables, v_table);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_tables, 1) > 0 THEN
    RAISE NOTICE 'Tabelas faltando: %', array_to_string(v_missing_tables, ', ');
  ELSE
    RAISE NOTICE '✓ Todas as tabelas principais existem';
  END IF;
END $$;

-- =====================================================
-- 2. VERIFICAR COLUNAS ESSENCIAIS
-- =====================================================
DO $$
DECLARE
  v_missing_columns TEXT[];
BEGIN
  -- Verificar colunas essenciais em people
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'people' 
    AND column_name = 'cpf'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'people.cpf');
  END IF;
  
  -- Verificar colunas essenciais em student_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'student_profiles' 
    AND column_name = 'person_id'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'student_profiles.person_id');
  END IF;
  
  -- Verificar colunas essenciais em classes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'school_id'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'classes.school_id');
  END IF;
  
  IF array_length(v_missing_columns, 1) > 0 THEN
    RAISE NOTICE 'Colunas faltando: %', array_to_string(v_missing_columns, ', ');
  ELSE
    RAISE NOTICE '✓ Colunas essenciais existem';
  END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR ÍNDICES ÚNICOS
-- =====================================================
DO $$
DECLARE
  v_missing_indexes TEXT[];
BEGIN
  -- Verificar índice único em people.cpf
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'people' 
    AND indexname LIKE '%cpf%'
  ) THEN
    v_missing_indexes := array_append(v_missing_indexes, 'people.cpf (unique)');
  END IF;
  
  -- Verificar índice único em schools.cnpj
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'schools' 
    AND indexname LIKE '%cnpj%'
  ) THEN
    v_missing_indexes := array_append(v_missing_indexes, 'schools.cnpj (unique)');
  END IF;
  
  IF array_length(v_missing_indexes, 1) > 0 THEN
    RAISE NOTICE 'Índices únicos faltando: %', array_to_string(v_missing_indexes, ', ');
  ELSE
    RAISE NOTICE '✓ Índices únicos essenciais existem';
  END IF;
END $$;

-- =====================================================
-- 4. VERIFICAR FOREIGN KEYS
-- =====================================================
DO $$
DECLARE
  v_missing_fks TEXT[];
BEGIN
  -- Verificar FK student_profiles -> people
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'student_profiles' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%person_id%'
  ) THEN
    v_missing_fks := array_append(v_missing_fks, 'student_profiles.person_id -> people.id');
  END IF;
  
  -- Verificar FK classes -> schools
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'classes' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%school_id%'
  ) THEN
    v_missing_fks := array_append(v_missing_fks, 'classes.school_id -> schools.id');
  END IF;
  
  IF array_length(v_missing_fks, 1) > 0 THEN
    RAISE NOTICE 'Foreign Keys faltando: %', array_to_string(v_missing_fks, ', ');
  ELSE
    RAISE NOTICE '✓ Foreign Keys essenciais existem';
  END IF;
END $$;

-- =====================================================
-- 5. VERIFICAR TRIGGERS DE VALIDAÇÃO
-- =====================================================
DO $$
DECLARE
  v_missing_triggers TEXT[];
  v_required_triggers TEXT[] := ARRAY[
    'check_unique_cpf',
    'check_unique_cnpj',
    'check_class_capacity',
    'check_period_in_year',
    'check_grade_range'
  ];
  v_trigger TEXT;
BEGIN
  FOREACH v_trigger IN ARRAY v_required_triggers
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = v_trigger
    ) THEN
      v_missing_triggers := array_append(v_missing_triggers, v_trigger);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_triggers, 1) > 0 THEN
    RAISE NOTICE 'Triggers faltando: %', array_to_string(v_missing_triggers, ', ');
  ELSE
    RAISE NOTICE '✓ Triggers de validação existem';
  END IF;
END $$;

-- =====================================================
-- 6. VERIFICAR VIEWS ÚTEIS
-- =====================================================
DO $$
DECLARE
  v_missing_views TEXT[];
  v_required_views TEXT[] := ARRAY[
    'v_student_full_info',
    'v_teacher_full_info',
    'v_class_roster',
    'v_student_grades',
    'v_student_attendance'
  ];
  v_view TEXT;
BEGIN
  FOREACH v_view IN ARRAY v_required_views
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = v_view
    ) THEN
      v_missing_views := array_append(v_missing_views, v_view);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_views, 1) > 0 THEN
    RAISE NOTICE 'Views faltando: %', array_to_string(v_missing_views, ', ');
  ELSE
    RAISE NOTICE '✓ Views úteis existem';
  END IF;
END $$;

-- =====================================================
-- 7. VERIFICAR FUNÇÕES ÚTEIS
-- =====================================================
DO $$
DECLARE
  v_missing_functions TEXT[];
  v_required_functions TEXT[] := ARRAY[
    'calculate_student_average',
    'calculate_attendance_percentage',
    'get_student_status',
    'check_enrollment_capacity',
    'calculate_student_age'
  ];
  v_function TEXT;
BEGIN
  FOREACH v_function IN ARRAY v_required_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proname = v_function
    ) THEN
      v_missing_functions := array_append(v_missing_functions, v_function);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_functions, 1) > 0 THEN
    RAISE NOTICE 'Funções faltando: %', array_to_string(v_missing_functions, ', ');
  ELSE
    RAISE NOTICE '✓ Funções úteis existem';
  END IF;
END $$;

-- =====================================================
-- 8. VERIFICAR RLS (Row Level Security)
-- =====================================================
DO $$
DECLARE
  v_tables_without_rls TEXT[];
  v_required_tables TEXT[] := ARRAY[
    'people',
    'schools',
    'student_profiles',
    'teacher_profiles',
    'classes',
    'student_enrollments',
    'grades',
    'attendances'
  ];
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY v_required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = v_table
      AND rowsecurity = TRUE
    ) THEN
      v_tables_without_rls := array_append(v_tables_without_rls, v_table);
    END IF;
  END LOOP;
  
  IF array_length(v_tables_without_rls, 1) > 0 THEN
    RAISE NOTICE 'Tabelas sem RLS: %', array_to_string(v_tables_without_rls, ', ');
  ELSE
    RAISE NOTICE '✓ RLS habilitado nas tabelas principais';
  END IF;
END $$;

-- =====================================================
-- 9. RESUMO FINAL
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO DA ESTRUTURA DO BANCO CONCLUÍDA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Verifique os avisos acima para identificar';
  RAISE NOTICE 'quaisquer problemas na estrutura do banco.';
  RAISE NOTICE '';
END $$;

