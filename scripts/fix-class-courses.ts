/**
 * Script para corrigir os cursos das turmas da E.M.E.F Magalhães Barata
 * Execute com: npx tsx scripts/fix-class-courses.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uosydcxfrbnhhasbyhqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc3lkY3hmcmJuaGhhc2J5aHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTU3NzgsImV4cCI6MjA4MjU5MTc3OH0.iFn2HNFPUjaTRhMlN7d37NxKFqFfNsHJinqe2zvgwDs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔄 Diagnóstico do banco de dados...\n');

  // 1. Verificar cursos
  console.log('📋 Tabela COURSES:');
  const { data: allCourses } = await supabase.from('courses').select('*');
  console.log(`   Total: ${allCourses?.length || 0}`);
  allCourses?.forEach(c => {
    console.log(`   - ID: ${c.id}, Nome: ${c.name}, Level: ${c.education_level}, Deletado: ${c.deleted_at ? 'SIM' : 'NÃO'}`);
  });

  // 2. Verificar turmas
  console.log('\n📋 Turmas da escola Magalhães Barata:');
  const { data: allClasses } = await supabase
    .from('classes')
    .select(`*, school:schools(id, name)`)
    .is('deleted_at', null);

  const magalhaesClasses = allClasses?.filter(c => {
    const school = c.school as { name: string } | null;
    return school?.name?.toLowerCase().includes('magalh');
  });

  console.log(`   Total: ${magalhaesClasses?.length || 0}`);
  magalhaesClasses?.forEach(c => {
    console.log(`   - ID: ${c.id}, Nome: ${c.name}, course_id: ${c.course_id}`);
  });

  // Verificar se há cursos ativos
  const activeCourses = allCourses?.filter(c => !c.deleted_at) || [];

  if (activeCourses.length === 0) {
    console.log('\n⚠️ NENHUM CURSO ATIVO ENCONTRADO!');
    console.log('   Você precisa criar as etapas de ensino primeiro.');
    console.log('   Acesse: Acadêmico > Etapas de Ensino > Nova Etapa de Ensino\n');
    return;
  }

  console.log('\n📚 Cursos ATIVOS:');
  activeCourses.forEach(c => {
    console.log(`   - ID: ${c.id}, Nome: ${c.name}, Level: ${c.education_level}`);
  });

  // Encontrar os cursos Anos Iniciais e Anos Finais
  const cursoAnosIniciais = activeCourses.find(c =>
    c.name?.toLowerCase().includes('anos iniciais') ||
    c.name?.toLowerCase().includes('fundamental i') ||
    c.education_level === 'Ensino Fundamental I'
  );

  const cursoAnosFinais = activeCourses.find(c =>
    c.name?.toLowerCase().includes('anos finais') ||
    c.name?.toLowerCase().includes('fundamental ii') ||
    c.education_level === 'Ensino Fundamental II'
  );

  console.log(`\n🎯 Curso Anos Iniciais: ${cursoAnosIniciais ? `${cursoAnosIniciais.name} (ID: ${cursoAnosIniciais.id})` : 'NÃO ENCONTRADO'}`);
  console.log(`🎯 Curso Anos Finais: ${cursoAnosFinais ? `${cursoAnosFinais.name} (ID: ${cursoAnosFinais.id})` : 'NÃO ENCONTRADO'}`);

  if (!cursoAnosIniciais || !cursoAnosFinais) {
    console.log('\n❌ Não foi possível encontrar os cursos necessários.');
    console.log('   Certifique-se de que existem cursos com os nomes:');
    console.log('   - "Ensino Fundamental - Anos Iniciais" ou education_level = "Ensino Fundamental I"');
    console.log('   - "Ensino Fundamental - Anos Finais" ou education_level = "Ensino Fundamental II"');
    return;
  }

  // 3. Atualizar turmas
  console.log('\n🔄 ATUALIZANDO TURMAS...\n');

  if (!magalhaesClasses?.length) {
    console.log('❌ Nenhuma turma encontrada para atualizar.');
    return;
  }

  for (const turma of magalhaesClasses) {
    let novoCursoId: number | null = null;
    let novoCursoNome = '';

    // Determinar curso baseado no nome da turma
    if (turma.name?.includes('5') && turma.name?.toLowerCase().includes('ano')) {
      novoCursoId = cursoAnosIniciais.id;
      novoCursoNome = cursoAnosIniciais.name;
    } else if (turma.name?.includes('6') && turma.name?.toLowerCase().includes('ano')) {
      novoCursoId = cursoAnosFinais.id;
      novoCursoNome = cursoAnosFinais.name;
    } else if (turma.name?.includes('9') && turma.name?.toLowerCase().includes('ano')) {
      novoCursoId = cursoAnosFinais.id;
      novoCursoNome = cursoAnosFinais.name;
    }

    if (novoCursoId) {
      const { error } = await supabase
        .from('classes')
        .update({ course_id: novoCursoId, updated_by: 1 })
        .eq('id', turma.id);

      if (error) {
        console.log(`❌ Erro ao atualizar ${turma.name}: ${error.message}`);
      } else {
        console.log(`✅ ${turma.name} → ${novoCursoNome}`);
      }
    } else {
      console.log(`⏭️ ${turma.name} - Não alterado (não é 5º, 6º ou 9º ano)`);
    }
  }

  // 4. Verificar resultado
  console.log('\n📊 RESULTADO FINAL:');
  const { data: finalClasses } = await supabase
    .from('classes')
    .select(`id, name, course_id, course:courses(name)`)
    .is('deleted_at', null);

  const finalMagalhaes = finalClasses?.filter(c =>
    magalhaesClasses.some(m => m.id === c.id)
  );

  finalMagalhaes?.forEach(c => {
    const curso = c.course as { name: string } | null;
    console.log(`   - ${c.name} → ${curso?.name || 'SEM CURSO'}`);
  });

  console.log('\n✅ Script finalizado!');
}

main().catch(console.error);
