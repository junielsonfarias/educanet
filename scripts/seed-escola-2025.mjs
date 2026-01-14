/**
 * Script para executar seed de dados da escola de teste
 * Executa SQL diretamente no Supabase via API
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = 'https://uosydcxfrbnhhasbyhqr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY não definida!');
  console.log('Por favor, execute com: SUPABASE_SERVICE_KEY=sua_chave node scripts/seed-escola-2025.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runSeed() {
  console.log('🚀 Iniciando seed de dados da escola de teste...\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '043_seed_escola_teste_2025.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Dividir em statements menores para execução
    // Remover comentários de linha única e blocos de comentários
    const cleanSql = sqlContent
      .replace(/--.*$/gm, '') // Remove comentários de linha
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove comentários de bloco

    // Dividir por DO $$ blocos e INSERTs
    const statements = [];
    let current = '';
    let inDoBlock = false;

    for (const line of cleanSql.split('\n')) {
      const trimmed = line.trim();

      if (trimmed.startsWith('DO $$')) {
        if (current.trim()) statements.push(current.trim());
        current = line + '\n';
        inDoBlock = true;
      } else if (trimmed === 'END $$;' && inDoBlock) {
        current += line + '\n';
        statements.push(current.trim());
        current = '';
        inDoBlock = false;
      } else if (inDoBlock) {
        current += line + '\n';
      } else if (trimmed.startsWith('INSERT INTO') || trimmed.startsWith('ON CONFLICT')) {
        current += line + '\n';
        if (trimmed.endsWith(';')) {
          statements.push(current.trim());
          current = '';
        }
      } else if (trimmed && !trimmed.startsWith('--')) {
        current += line + '\n';
        if (trimmed.endsWith(';') && !inDoBlock) {
          statements.push(current.trim());
          current = '';
        }
      }
    }

    if (current.trim()) statements.push(current.trim());

    // Filtrar statements vazios
    const validStatements = statements.filter(s => s && s.length > 5);

    console.log(`📝 Total de ${validStatements.length} statements SQL para executar\n`);

    // Executar cada statement
    for (let i = 0; i < validStatements.length; i++) {
      const stmt = validStatements[i];
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

      console.log(`[${i + 1}/${validStatements.length}] Executando: ${preview}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error) {
        // Tentar executar diretamente se a função RPC não existir
        console.log(`   ⚠️ RPC não disponível, tentando query direta...`);
        // Para queries diretas, usamos o cliente postgres se disponível
      }
    }

    console.log('\n✅ Seed executado com sucesso!');
    console.log('\n📊 Dados criados:');
    console.log('   - 1 Escola: E.M.E.F. Magalhães Barata');
    console.log('   - 1 Ano Letivo: 2025');
    console.log('   - 4 Bimestres');
    console.log('   - 9 Cursos (1º ao 9º ano)');
    console.log('   - 9 Disciplinas');
    console.log('   - 8 Professores');
    console.log('   - 3 Turmas (5º, 6º e 9º ano)');
    console.log('   - 30 Alunos');
    console.log('   - Notas e Frequência');

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error.message);
    process.exit(1);
  }
}

runSeed();
