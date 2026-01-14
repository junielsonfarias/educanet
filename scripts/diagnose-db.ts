/**
 * Script de diagnóstico do banco de dados
 * Execute com: npx tsx scripts/diagnose-db.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uosydcxfrbnhhasbyhqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc3lkY3hmcmJuaGhhc2J5aHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTU3NzgsImV4cCI6MjA4MjU5MTc3OH0.iFn2HNFPUjaTRhMlN7d37NxKFqFfNsHJinqe2zvgwDs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Diagnóstico completo do banco de dados...\n');

  // 1. Tabela courses
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📚 TABELA: courses');
  console.log('═══════════════════════════════════════════════════════════');

  const { data: allCourses, error: coursesError } = await supabase
    .from('courses')
    .select('*');

  if (coursesError) {
    console.log(`   ❌ Erro: ${coursesError.message}`);
  } else {
    console.log(`   Total de registros: ${allCourses?.length || 0}`);
    if (allCourses?.length) {
      allCourses.forEach(c => {
        console.log(`   - ID: ${c.id}`);
        console.log(`     Nome: ${c.name}`);
        console.log(`     Level: ${c.education_level}`);
        console.log(`     Deletado: ${c.deleted_at || 'NÃO'}`);
        console.log('');
      });
    }
  }

  // 2. Tabela school_academic_year_courses
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🏫 TABELA: school_academic_year_courses');
  console.log('═══════════════════════════════════════════════════════════');

  const { data: schoolCourses, error: scError } = await supabase
    .from('school_academic_year_courses')
    .select(`
      *,
      school:schools(id, name),
      course:courses(id, name, education_level)
    `);

  if (scError) {
    console.log(`   ❌ Erro: ${scError.message}`);
  } else {
    console.log(`   Total de registros: ${schoolCourses?.length || 0}`);
    if (schoolCourses?.length) {
      schoolCourses.forEach(sc => {
        const school = sc.school as { id: number; name: string } | null;
        const course = sc.course as { id: number; name: string; education_level: string } | null;
        console.log(`   - Escola: ${school?.name || 'N/A'} (ID: ${school?.id})`);
        console.log(`     Curso: ${course?.name || 'N/A'} (ID: ${course?.id})`);
        console.log(`     Level: ${course?.education_level || 'N/A'}`);
        console.log(`     Ano Letivo: ${sc.academic_year_id}`);
        console.log('');
      });
    }
  }

  // 3. Tabela school_course_grades
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 TABELA: school_course_grades');
  console.log('═══════════════════════════════════════════════════════════');

  const { data: scGrades, error: scgError } = await supabase
    .from('school_course_grades')
    .select(`
      *,
      school_academic_year_course:school_academic_year_courses(
        id,
        course:courses(id, name)
      )
    `);

  if (scgError) {
    console.log(`   ❌ Erro: ${scgError.message}`);
  } else {
    console.log(`   Total de registros: ${scGrades?.length || 0}`);
    if (scGrades?.length) {
      scGrades.forEach(g => {
        const sac = g.school_academic_year_course as { id: number; course: { id: number; name: string } } | null;
        console.log(`   - Serie: ${g.grade_name}`);
        console.log(`     Curso: ${sac?.course?.name || 'N/A'}`);
        console.log('');
      });
    }
  }

  // 4. Turmas da escola Magalhães Barata
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 TURMAS: E.M.E.F Magalhães Barata');
  console.log('═══════════════════════════════════════════════════════════');

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      course_id,
      grade_id,
      school:schools!inner(id, name),
      course:courses(id, name, education_level)
    `)
    .ilike('schools.name', '%Magalh%Barata%')
    .is('deleted_at', null);

  if (classesError) {
    console.log(`   ❌ Erro: ${classesError.message}`);
  } else {
    console.log(`   Total de turmas: ${classes?.length || 0}`);
    if (classes?.length) {
      classes.forEach(c => {
        const school = c.school as { id: number; name: string } | null;
        const course = c.course as { id: number; name: string; education_level: string } | null;
        console.log(`   - Turma: ${c.name} (ID: ${c.id})`);
        console.log(`     Escola: ${school?.name || 'N/A'}`);
        console.log(`     course_id: ${c.course_id || 'NULL'}`);
        console.log(`     grade_id: ${c.grade_id || 'NULL'}`);
        console.log(`     Curso vinculado: ${course?.name || 'NENHUM'}`);
        console.log('');
      });
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Diagnóstico concluído');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(console.error);
