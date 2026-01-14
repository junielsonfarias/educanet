/**
 * Script para executar a migration 050
 * Cria os cursos e atualiza as turmas da E.M.E.F Magalhães Barata
 * Execute com: npx tsx scripts/run-migration-050.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uosydcxfrbnhhasbyhqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc3lkY3hmcmJuaGhhc2J5aHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTU3NzgsImV4cCI6MjA4MjU5MTc3OH0.iFn2HNFPUjaTRhMlN7d37NxKFqFfNsHJinqe2zvgwDs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Iniciando criação de cursos e atualização de turmas...\n');

  // =============================================================================
  // 1. CRIAR CURSOS (ETAPAS DE ENSINO)
  // =============================================================================
  console.log('📚 Criando cursos (Etapas de Ensino)...\n');

  const cursosParaCriar = [
    { name: 'Educação Infantil', education_level: 'Educação Infantil' },
    { name: 'Ensino Fundamental - Anos Iniciais', education_level: 'Ensino Fundamental I' },
    { name: 'Ensino Fundamental - Anos Finais', education_level: 'Ensino Fundamental II' },
    { name: 'Ensino Médio', education_level: 'Ensino Médio' },
    { name: 'EJA - Educação de Jovens e Adultos', education_level: 'EJA' },
  ];

  for (const curso of cursosParaCriar) {
    // Verificar se já existe
    const { data: existente } = await supabase
      .from('courses')
      .select('id, name')
      .eq('education_level', curso.education_level)
      .is('deleted_at', null)
      .single();

    if (existente) {
      console.log(`   ⏭️ ${curso.name} já existe (ID: ${existente.id})`);
    } else {
      const { data: novoCurso, error } = await supabase
        .from('courses')
        .insert({
          name: curso.name,
          education_level: curso.education_level,
          created_by: 1,
        })
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Erro ao criar ${curso.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${curso.name} criado (ID: ${novoCurso?.id})`);
      }
    }
  }

  // =============================================================================
  // 2. BUSCAR IDS DOS CURSOS
  // =============================================================================
  console.log('\n📋 Buscando cursos criados...');

  const { data: cursos } = await supabase
    .from('courses')
    .select('*')
    .is('deleted_at', null);

  console.log(`   Total de cursos ativos: ${cursos?.length || 0}`);
  cursos?.forEach(c => {
    console.log(`   - ID: ${c.id}, Nome: ${c.name}, Level: ${c.education_level}`);
  });

  const cursoAnosIniciais = cursos?.find(c => c.education_level === 'Ensino Fundamental I');
  const cursoAnosFinais = cursos?.find(c => c.education_level === 'Ensino Fundamental II');

  if (!cursoAnosIniciais || !cursoAnosFinais) {
    console.log('\n❌ Erro: Cursos necessários não encontrados!');
    return;
  }

  console.log(`\n🎯 Curso Anos Iniciais: ${cursoAnosIniciais.name} (ID: ${cursoAnosIniciais.id})`);
  console.log(`🎯 Curso Anos Finais: ${cursoAnosFinais.name} (ID: ${cursoAnosFinais.id})`);

  // =============================================================================
  // 3. BUSCAR ESCOLA MAGALHÃES BARATA
  // =============================================================================
  console.log('\n🏫 Buscando escola Magalhães Barata...');

  const { data: escolas } = await supabase
    .from('schools')
    .select('id, name')
    .ilike('name', '%Magalh%Barata%')
    .is('deleted_at', null);

  if (!escolas?.length) {
    console.log('   ❌ Escola não encontrada!');
    return;
  }

  const escola = escolas[0];
  console.log(`   ✅ Encontrada: ${escola.name} (ID: ${escola.id})`);

  // =============================================================================
  // 4. BUSCAR TURMAS DA ESCOLA
  // =============================================================================
  console.log('\n📋 Buscando turmas da escola...');

  const { data: turmas } = await supabase
    .from('classes')
    .select('id, name, course_id')
    .eq('school_id', escola.id)
    .is('deleted_at', null);

  console.log(`   Total de turmas: ${turmas?.length || 0}`);
  turmas?.forEach(t => {
    console.log(`   - ID: ${t.id}, Nome: ${t.name}, course_id: ${t.course_id || 'NULL'}`);
  });

  // =============================================================================
  // 5. ATUALIZAR TURMAS
  // =============================================================================
  console.log('\n🔄 Atualizando turmas...\n');

  for (const turma of turmas || []) {
    let novoCursoId: number | null = null;
    let novoCursoNome = '';

    // Determinar curso baseado no nome da turma
    // Anos Iniciais: 1º ao 5º Ano
    if (turma.name?.match(/[1-5].?\s*[Aa]no/)) {
      novoCursoId = cursoAnosIniciais.id;
      novoCursoNome = cursoAnosIniciais.name;
    }
    // Anos Finais: 6º ao 9º Ano
    else if (turma.name?.match(/[6-9].?\s*[Aa]no/)) {
      novoCursoId = cursoAnosFinais.id;
      novoCursoNome = cursoAnosFinais.name;
    }

    if (novoCursoId) {
      const { error } = await supabase
        .from('classes')
        .update({ course_id: novoCursoId, updated_by: 1 })
        .eq('id', turma.id);

      if (error) {
        console.log(`   ❌ Erro ao atualizar ${turma.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${turma.name} → ${novoCursoNome}`);
      }
    } else {
      console.log(`   ⏭️ ${turma.name} - Não é turma de Ensino Fundamental`);
    }
  }

  // =============================================================================
  // 6. VERIFICAR RESULTADO FINAL
  // =============================================================================
  console.log('\n📊 RESULTADO FINAL:');

  const { data: turmasFinais } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      course:courses(name, education_level)
    `)
    .eq('school_id', escola.id)
    .is('deleted_at', null);

  turmasFinais?.forEach(t => {
    const curso = t.course as { name: string; education_level: string } | null;
    console.log(`   - ${t.name} → ${curso?.name || 'SEM CURSO'}`);
  });

  console.log('\n✅ Script finalizado com sucesso!');
}

main().catch(console.error);
