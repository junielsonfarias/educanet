// Dados Mocks Expandidos e Completos
// Alinhados com a nova nomenclatura do Censo Escolar
// Este arquivo contém dados completos para simulação do sistema

import {
  School,
  AnoLetivo,
  Turma,
  Teacher,
  Student,
  Enrollment,
  Assessment,
  AttendanceRecord,
  Occurrence,
  Staff,
  ClassCouncil,
  StudentTransfer,
  DocumentAttachment,
  Protocol,
  Appointment,
  QueueItem,
  SchoolDocument,
  NewsPost,
  PublicDocument,
  InstitutionalContent,
  EtapaEnsino,
  AssessmentType,
} from './mock-data'

// ============================================
// ETAPAS DE ENSINO EXPANDIDAS
// ============================================

export const expandedMockEtapasEnsino: EtapaEnsino[] = [
  {
    id: 'e1',
    name: 'Educação Infantil',
    codigoCenso: '01',
    seriesAnos: [
      {
        id: 'ei1',
        name: 'Creche - 0 a 2 anos',
        numero: 0,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 'ei_s1', name: 'Linguagem Oral e Escrita', workload: 200 },
          { id: 'ei_s2', name: 'Matemática', workload: 200 },
          { id: 'ei_s3', name: 'Natureza e Sociedade', workload: 150 },
          { id: 'ei_s4', name: 'Artes', workload: 100 },
          { id: 'ei_s5', name: 'Movimento', workload: 100 },
        ],
      },
      {
        id: 'ei2',
        name: 'Pré-Escola - 3 a 5 anos',
        numero: 0,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 'ei_s6', name: 'Linguagem Oral e Escrita', workload: 200 },
          { id: 'ei_s7', name: 'Matemática', workload: 200 },
          { id: 'ei_s8', name: 'Natureza e Sociedade', workload: 150 },
          { id: 'ei_s9', name: 'Artes', workload: 100 },
          { id: 'ei_s10', name: 'Movimento', workload: 100 },
        ],
      },
    ],
  },
  {
    id: 'e2',
    name: 'Ensino Fundamental - Anos Iniciais',
    codigoCenso: '03',
    seriesAnos: [
      {
        id: 'sa1',
        name: '1º Ano',
        numero: 1,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 's1', name: 'Português', workload: 200 },
          { id: 's2', name: 'Matemática', workload: 200 },
          { id: 's3', name: 'Ciências', workload: 80 },
          { id: 's4', name: 'História', workload: 80 },
          { id: 's5', name: 'Geografia', workload: 80 },
          { id: 's6', name: 'Artes', workload: 80 },
          { id: 's7', name: 'Educação Física', workload: 80 },
        ],
      },
      {
        id: 'sa2',
        name: '2º Ano',
        numero: 2,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 's8', name: 'Português', workload: 200 },
          { id: 's9', name: 'Matemática', workload: 200 },
          { id: 's10', name: 'Ciências', workload: 80 },
          { id: 's11', name: 'História', workload: 80 },
          { id: 's12', name: 'Geografia', workload: 80 },
          { id: 's13', name: 'Artes', workload: 80 },
          { id: 's14', name: 'Educação Física', workload: 80 },
        ],
      },
      {
        id: 'sa3',
        name: '3º Ano',
        numero: 3,
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 's15', name: 'Português', workload: 180 },
          { id: 's16', name: 'Matemática', workload: 180 },
          { id: 's17', name: 'Ciências', workload: 80 },
          { id: 's18', name: 'História', workload: 80 },
          { id: 's19', name: 'Geografia', workload: 80 },
          { id: 's20', name: 'Artes', workload: 80 },
          { id: 's21', name: 'Educação Física', workload: 80 },
        ],
      },
      {
        id: 'sa4',
        name: '4º Ano',
        numero: 4,
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 's22', name: 'Português', workload: 180 },
          { id: 's23', name: 'Matemática', workload: 180 },
          { id: 's24', name: 'Ciências', workload: 80 },
          { id: 's25', name: 'História', workload: 80 },
          { id: 's26', name: 'Geografia', workload: 80 },
          { id: 's27', name: 'Artes', workload: 80 },
          { id: 's28', name: 'Educação Física', workload: 80 },
        ],
      },
      {
        id: 'sa5',
        name: '5º Ano',
        numero: 5,
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 's29', name: 'Português', workload: 180 },
          { id: 's30', name: 'Matemática', workload: 180 },
          { id: 's31', name: 'Ciências', workload: 80 },
          { id: 's32', name: 'História', workload: 80 },
          { id: 's33', name: 'Geografia', workload: 80 },
          { id: 's34', name: 'Artes', workload: 80 },
          { id: 's35', name: 'Educação Física', workload: 80 },
        ],
      },
    ],
  },
  {
    id: 'e3',
    name: 'Ensino Fundamental - Anos Finais',
    codigoCenso: '04',
    seriesAnos: [
      {
        id: 'sa6',
        name: '6º Ano',
        numero: 6,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's36', name: 'Português', workload: 180 },
          { id: 's37', name: 'Matemática', workload: 180 },
          { id: 's38', name: 'Ciências', workload: 80 },
          { id: 's39', name: 'História', workload: 80 },
          { id: 's40', name: 'Geografia', workload: 80 },
          { id: 's41', name: 'Artes', workload: 80 },
          { id: 's42', name: 'Educação Física', workload: 80 },
          { id: 's43', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'sa7',
        name: '7º Ano',
        numero: 7,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's44', name: 'Português', workload: 180 },
          { id: 's45', name: 'Matemática', workload: 180 },
          { id: 's46', name: 'Ciências', workload: 80 },
          { id: 's47', name: 'História', workload: 80 },
          { id: 's48', name: 'Geografia', workload: 80 },
          { id: 's49', name: 'Artes', workload: 80 },
          { id: 's50', name: 'Educação Física', workload: 80 },
          { id: 's51', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'sa8',
        name: '8º Ano',
        numero: 8,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's52', name: 'Português', workload: 180 },
          { id: 's53', name: 'Matemática', workload: 180 },
          { id: 's54', name: 'Ciências', workload: 80 },
          { id: 's55', name: 'História', workload: 80 },
          { id: 's56', name: 'Geografia', workload: 80 },
          { id: 's57', name: 'Artes', workload: 80 },
          { id: 's58', name: 'Educação Física', workload: 80 },
          { id: 's59', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'sa9',
        name: '9º Ano',
        numero: 9,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's60', name: 'Português', workload: 180 },
          { id: 's61', name: 'Matemática', workload: 180 },
          { id: 's62', name: 'Ciências', workload: 80 },
          { id: 's63', name: 'História', workload: 80 },
          { id: 's64', name: 'Geografia', workload: 80 },
          { id: 's65', name: 'Artes', workload: 80 },
          { id: 's66', name: 'Educação Física', workload: 80 },
          { id: 's67', name: 'Inglês', workload: 80 },
        ],
      },
    ],
  },
  {
    id: 'e4',
    name: 'Ensino Médio',
    codigoCenso: '08',
    seriesAnos: [
      {
        id: 'em1',
        name: '1º Ano',
        numero: 1,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's68', name: 'Português', workload: 200 },
          { id: 's69', name: 'Matemática', workload: 200 },
          { id: 's70', name: 'Física', workload: 80 },
          { id: 's71', name: 'Química', workload: 80 },
          { id: 's72', name: 'Biologia', workload: 80 },
          { id: 's73', name: 'História', workload: 80 },
          { id: 's74', name: 'Geografia', workload: 80 },
          { id: 's75', name: 'Filosofia', workload: 80 },
          { id: 's76', name: 'Sociologia', workload: 80 },
          { id: 's77', name: 'Artes', workload: 80 },
          { id: 's78', name: 'Educação Física', workload: 80 },
          { id: 's79', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'em2',
        name: '2º Ano',
        numero: 2,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's80', name: 'Português', workload: 200 },
          { id: 's81', name: 'Matemática', workload: 200 },
          { id: 's82', name: 'Física', workload: 80 },
          { id: 's83', name: 'Química', workload: 80 },
          { id: 's84', name: 'Biologia', workload: 80 },
          { id: 's85', name: 'História', workload: 80 },
          { id: 's86', name: 'Geografia', workload: 80 },
          { id: 's87', name: 'Filosofia', workload: 80 },
          { id: 's88', name: 'Sociologia', workload: 80 },
          { id: 's89', name: 'Artes', workload: 80 },
          { id: 's90', name: 'Educação Física', workload: 80 },
          { id: 's91', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'em3',
        name: '3º Ano',
        numero: 3,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's92', name: 'Português', workload: 200 },
          { id: 's93', name: 'Matemática', workload: 200 },
          { id: 's94', name: 'Física', workload: 80 },
          { id: 's95', name: 'Química', workload: 80 },
          { id: 's96', name: 'Biologia', workload: 80 },
          { id: 's97', name: 'História', workload: 80 },
          { id: 's98', name: 'Geografia', workload: 80 },
          { id: 's99', name: 'Filosofia', workload: 80 },
          { id: 's100', name: 'Sociologia', workload: 80 },
          { id: 's101', name: 'Artes', workload: 80 },
          { id: 's102', name: 'Educação Física', workload: 80 },
          { id: 's103', name: 'Inglês', workload: 80 },
        ],
      },
    ],
  },
  {
    id: 'e5',
    name: 'EJA - Educação de Jovens e Adultos',
    codigoCenso: '69',
    seriesAnos: [
      {
        id: 'eja1',
        name: 'EJA - Fase I (1º ao 3º Ano)',
        numero: 1,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 'eja_s1', name: 'Língua Portuguesa', workload: 200 },
          { id: 'eja_s2', name: 'Matemática', workload: 200 },
          { id: 'eja_s3', name: 'Ciências da Natureza', workload: 100 },
          { id: 'eja_s4', name: 'Ciências Humanas', workload: 100 },
        ],
      },
      {
        id: 'eja2',
        name: 'EJA - Fase II (4º e 5º Ano)',
        numero: 2,
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 'eja_s5', name: 'Língua Portuguesa', workload: 180 },
          { id: 'eja_s6', name: 'Matemática', workload: 180 },
          { id: 'eja_s7', name: 'Ciências da Natureza', workload: 100 },
          { id: 'eja_s8', name: 'Ciências Humanas', workload: 100 },
        ],
      },
    ],
  },
]

// ============================================
// TIPOS DE AVALIAÇÃO EXPANDIDOS
// ============================================

export const expandedMockAssessmentTypes: AssessmentType[] = [
  {
    id: 'at1',
    name: 'Prova Bimestral',
    description: 'Avaliação principal do bimestre, abrangendo todo o conteúdo.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: false,
  },
  {
    id: 'at2',
    name: 'Trabalho em Grupo',
    description: 'Atividades realizadas em equipe para avaliação de competências colaborativas.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: false,
  },
  {
    id: 'at3',
    name: 'Simulado Extra',
    description: 'Teste simulado para preparação, sem impacto na nota final.',
    applicableSerieAnoIds: ['sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: true,
  },
  {
    id: 'at4',
    name: 'Avaliação Diagnóstica',
    description: 'Avaliação inicial para identificar conhecimentos prévios.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9'],
    excludeFromAverage: false,
  },
  {
    id: 'at5',
    name: 'Avaliação Formativa',
    description: 'Avaliação contínua durante o processo de aprendizagem.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: false,
  },
  {
    id: 'at6',
    name: 'Prova de Recuperação',
    description: 'Avaliação para recuperação de notas abaixo da média.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: false,
  },
  {
    id: 'at7',
    name: 'ENEM',
    description: 'Exame Nacional do Ensino Médio.',
    applicableSerieAnoIds: ['em1', 'em2', 'em3'],
    excludeFromAverage: true,
  },
  {
    id: 'at8',
    name: 'SAEB',
    description: 'Sistema de Avaliação da Educação Básica.',
    applicableSerieAnoIds: ['sa5', 'sa9'],
    excludeFromAverage: true,
  },
]

// ============================================
// ESCOLAS EXPANDIDAS COM TURMAS COMPLETAS
// ============================================

export const expandedMockSchools: School[] = [
  {
    id: '1',
    code: 'ESC-001',
    name: 'Escola Municipal Monteiro Lobato',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 3456-7890',
    director: 'Maria Silva',
    status: 'active',
    logo: 'https://img.usecurling.com/i?q=school&shape=outline&color=blue',
    inepCode: '12345678',
    administrativeDependency: 'Municipal',
    locationType: 'Urbana',
    polo: 'Polo Centro',
    coordinates: { lat: 40, lng: 30 },
    infrastructure: {
      classrooms: 20,
      accessible: true,
      internet: true,
      library: true,
      lab: true,
    },
    educationTypes: ['Ensino Fundamental'],
    academicYears: [
      {
        id: 'y2024',
        name: '2024',
        ano: 2024,
        startDate: '2024-02-01',
        endDate: '2024-12-15',
        status: 'active',
        periods: [
          { id: 'p1', name: '1º Bimestre', startDate: '2024-02-01', endDate: '2024-04-15' },
          { id: 'p2', name: '2º Bimestre', startDate: '2024-04-16', endDate: '2024-06-30' },
          { id: 'p3', name: '3º Bimestre', startDate: '2024-08-01', endDate: '2024-09-30' },
          { id: 'p4', name: '4º Bimestre', startDate: '2024-10-01', endDate: '2024-12-15' },
        ],
        turmas: [
          {
            id: 'cl1',
            name: '5º Ano A',
            shift: 'Matutino',
            serieAnoId: 'sa5',
            serieAnoName: '5º Ano',
            etapaEnsinoId: 'e2',
            etapaEnsinoName: 'Ensino Fundamental - Anos Iniciais',
            studentCount: 25,
            acronym: '5A-M',
            operatingHours: '07:00 - 12:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 2,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 30,
          },
          {
            id: 'cl2',
            name: '1º Ano A',
            shift: 'Vespertino',
            serieAnoId: 'sa1',
            serieAnoName: '1º Ano',
            etapaEnsinoId: 'e2',
            etapaEnsinoName: 'Ensino Fundamental - Anos Iniciais',
            studentCount: 20,
            acronym: '1A-V',
            operatingHours: '13:00 - 18:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 0,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 25,
          },
          {
            id: 'cl3',
            name: '2º Ano A',
            shift: 'Matutino',
            serieAnoId: 'sa2',
            serieAnoName: '2º Ano',
            etapaEnsinoId: 'e2',
            etapaEnsinoName: 'Ensino Fundamental - Anos Iniciais',
            studentCount: 22,
            acronym: '2A-M',
            operatingHours: '07:00 - 12:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 0,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 25,
          },
          {
            id: 'cl4',
            name: '3º Ano A',
            shift: 'Matutino',
            serieAnoId: 'sa3',
            serieAnoName: '3º Ano',
            etapaEnsinoId: 'e2',
            etapaEnsinoName: 'Ensino Fundamental - Anos Iniciais',
            studentCount: 24,
            acronym: '3A-M',
            operatingHours: '07:00 - 12:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 1,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 30,
          },
          {
            id: 'cl5',
            name: '4º Ano A',
            shift: 'Vespertino',
            serieAnoId: 'sa4',
            serieAnoName: '4º Ano',
            etapaEnsinoId: 'e2',
            etapaEnsinoName: 'Ensino Fundamental - Anos Iniciais',
            studentCount: 23,
            acronym: '4A-V',
            operatingHours: '13:00 - 18:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 1,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 30,
          },
          {
            id: 'cl6',
            name: '6º Ano A',
            shift: 'Matutino',
            serieAnoId: 'sa6',
            serieAnoName: '6º Ano',
            etapaEnsinoId: 'e3',
            etapaEnsinoName: 'Ensino Fundamental - Anos Finais',
            studentCount: 28,
            acronym: '6A-M',
            operatingHours: '07:00 - 12:00',
            minStudents: 20,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 2,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 35,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    code: 'ESC-002',
    name: 'Escola Municipal Cecília Meireles',
    address: 'Av. Paulista, 456 - Bela Vista',
    phone: '(11) 3456-1234',
    director: 'João Santos',
    status: 'active',
    logo: 'https://img.usecurling.com/i?q=school&shape=outline&color=green',
    inepCode: '87654321',
    administrativeDependency: 'Municipal',
    locationType: 'Urbana',
    polo: 'Polo Sul',
    coordinates: { lat: 60, lng: 70 },
    infrastructure: {
      classrooms: 15,
      accessible: true,
      internet: true,
      library: true,
      lab: true,
    },
    educationTypes: ['Ensino Fundamental', 'Educação Infantil'],
    academicYears: [
      {
        id: 'y2024_2',
        name: '2024',
        ano: 2024,
        startDate: '2024-02-01',
        endDate: '2024-12-15',
        status: 'active',
        periods: [
          { id: 'p1_2', name: '1º Bimestre', startDate: '2024-02-01', endDate: '2024-04-15' },
          { id: 'p2_2', name: '2º Bimestre', startDate: '2024-04-16', endDate: '2024-06-30' },
          { id: 'p3_2', name: '3º Bimestre', startDate: '2024-08-01', endDate: '2024-09-30' },
          { id: 'p4_2', name: '4º Bimestre', startDate: '2024-10-01', endDate: '2024-12-15' },
        ],
        turmas: [
          {
            id: 'cl7',
            name: '7º Ano A',
            shift: 'Matutino',
            serieAnoId: 'sa7',
            serieAnoName: '7º Ano',
            etapaEnsinoId: 'e3',
            etapaEnsinoName: 'Ensino Fundamental - Anos Finais',
            studentCount: 30,
            acronym: '7A-M',
            operatingHours: '07:00 - 12:00',
            minStudents: 20,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 2,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 35,
          },
          {
            id: 'cl8',
            name: '8º Ano A',
            shift: 'Vespertino',
            serieAnoId: 'sa8',
            serieAnoName: '8º Ano',
            etapaEnsinoId: 'e3',
            etapaEnsinoName: 'Ensino Fundamental - Anos Finais',
            studentCount: 28,
            acronym: '8A-V',
            operatingHours: '13:00 - 18:00',
            minStudents: 20,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 2,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 35,
          },
        ],
      },
    ],
  },
  {
    id: '3',
    code: 'ESC-003',
    name: 'Escola Municipal Vinícius de Moraes',
    address: 'Rua dos Estudantes, 789 - Vila Nova',
    phone: '(11) 3456-5678',
    director: 'Ana Paula Costa',
    status: 'active',
    logo: 'https://img.usecurling.com/i?q=school&shape=outline&color=purple',
    inepCode: '11223344',
    administrativeDependency: 'Municipal',
    locationType: 'Urbana',
    polo: 'Polo Norte',
    coordinates: { lat: 20, lng: 50 },
    infrastructure: {
      classrooms: 18,
      accessible: true,
      internet: true,
      library: true,
      lab: true,
    },
    educationTypes: ['Ensino Médio'],
    academicYears: [
      {
        id: 'y2024_3',
        name: '2024',
        ano: 2024,
        startDate: '2024-02-01',
        endDate: '2024-12-15',
        status: 'active',
        periods: [
          { id: 'p1_3', name: '1º Bimestre', startDate: '2024-02-01', endDate: '2024-04-15' },
          { id: 'p2_3', name: '2º Bimestre', startDate: '2024-04-16', endDate: '2024-06-30' },
          { id: 'p3_3', name: '3º Bimestre', startDate: '2024-08-01', endDate: '2024-09-30' },
          { id: 'p4_3', name: '4º Bimestre', startDate: '2024-10-01', endDate: '2024-12-15' },
        ],
        turmas: [
          {
            id: 'cl9',
            name: '1º Ano EM A',
            shift: 'Matutino',
            serieAnoId: 'em1',
            serieAnoName: '1º Ano',
            etapaEnsinoId: 'e4',
            etapaEnsinoName: 'Ensino Médio',
            studentCount: 32,
            acronym: '1EM-A-M',
            operatingHours: '07:00 - 12:00',
            minStudents: 25,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 3,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
            maxCapacity: 40,
          },
        ],
      },
    ],
  },
]

// ============================================
// PROFESSORES EXPANDIDOS
// ============================================

export const expandedMockTeachers: Teacher[] = [
  {
    id: 't1',
    name: 'Prof. Alberto Campos',
    email: 'alberto.campos@prof.edu.gov',
    subject: 'Matemática',
    phone: '(11) 91234-5678',
    status: 'active',
    cpf: '123.456.789-00',
    employmentBond: 'Efetivo',
    admissionDate: '2020-02-01',
    role: 'Professor II',
    academicBackground: 'Licenciatura em Matemática pela USP. Pós-graduação em Educação Matemática.',
    allocations: [
      { id: 'a1', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', subjectId: 's30', createdAt: new Date().toISOString() },
      { id: 'a2', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl6', subjectId: 's37', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't2',
    name: 'Prof. Beatriz Oliveira',
    email: 'beatriz.oliveira@prof.edu.gov',
    subject: 'Português',
    phone: '(11) 91234-5679',
    status: 'active',
    cpf: '234.567.890-11',
    employmentBond: 'Efetivo',
    admissionDate: '2019-03-15',
    role: 'Professor II',
    academicBackground: 'Licenciatura em Letras pela UNESP. Especialização em Literatura Brasileira.',
    allocations: [
      { id: 'a3', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', subjectId: 's29', createdAt: new Date().toISOString() },
      { id: 'a4', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl2', subjectId: 's1', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't3',
    name: 'Prof. Carlos Mendes',
    email: 'carlos.mendes@prof.edu.gov',
    subject: 'História',
    phone: '(11) 91234-5680',
    status: 'active',
    cpf: '345.678.901-22',
    employmentBond: 'Contratado',
    admissionDate: '2021-08-01',
    role: 'Professor I',
    academicBackground: 'Licenciatura em História pela PUC-SP.',
    allocations: [
      { id: 'a5', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', subjectId: 's32', createdAt: new Date().toISOString() },
      { id: 'a6', schoolId: '2', academicYearId: 'y2024_2', classroomId: 'cl7', subjectId: 's47', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't4',
    name: 'Prof. Daniela Santos',
    email: 'daniela.santos@prof.edu.gov',
    subject: 'Ciências',
    phone: '(11) 91234-5681',
    status: 'active',
    cpf: '456.789.012-33',
    employmentBond: 'Efetivo',
    admissionDate: '2018-02-01',
    role: 'Professor II',
    academicBackground: 'Licenciatura em Ciências Biológicas pela USP. Mestrado em Educação.',
    allocations: [
      { id: 'a7', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', subjectId: 's31', createdAt: new Date().toISOString() },
      { id: 'a8', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl6', subjectId: 's38', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't5',
    name: 'Prof. Eduardo Lima',
    email: 'eduardo.lima@prof.edu.gov',
    subject: 'Geografia',
    phone: '(11) 91234-5682',
    status: 'active',
    cpf: '567.890.123-44',
    employmentBond: 'Efetivo',
    admissionDate: '2020-02-01',
    role: 'Professor II',
    academicBackground: 'Licenciatura em Geografia pela UNICAMP.',
    allocations: [
      { id: 'a9', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', subjectId: 's33', createdAt: new Date().toISOString() },
      { id: 'a10', schoolId: '2', academicYearId: 'y2024_2', classroomId: 'cl7', subjectId: 's48', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't6',
    name: 'Prof. Fernanda Costa',
    email: 'fernanda.costa@prof.edu.gov',
    subject: 'Artes',
    phone: '(11) 91234-5683',
    status: 'active',
    cpf: '678.901.234-55',
    employmentBond: 'Contratado',
    admissionDate: '2022-02-01',
    role: 'Professor I',
    academicBackground: 'Licenciatura em Artes Visuais pela UNESP.',
    allocations: [
      { id: 'a11', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', subjectId: 's34', createdAt: new Date().toISOString() },
      { id: 'a12', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl2', subjectId: 's6', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't7',
    name: 'Prof. Gabriel Alves',
    email: 'gabriel.alves@prof.edu.gov',
    subject: 'Educação Física',
    phone: '(11) 91234-5684',
    status: 'active',
    cpf: '789.012.345-66',
    employmentBond: 'Efetivo',
    admissionDate: '2019-02-01',
    role: 'Professor II',
    academicBackground: 'Licenciatura em Educação Física pela UNICAMP.',
    allocations: [
      { id: 'a13', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', subjectId: 's35', createdAt: new Date().toISOString() },
      { id: 'a14', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl2', subjectId: 's7', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't8',
    name: 'Prof. Helena Rodrigues',
    email: 'helena.rodrigues@prof.edu.gov',
    subject: 'Inglês',
    phone: '(11) 91234-5685',
    status: 'active',
    cpf: '890.123.456-77',
    employmentBond: 'Efetivo',
    admissionDate: '2020-02-01',
    role: 'Professor II',
    academicBackground: 'Licenciatura em Letras - Inglês pela USP.',
    allocations: [
      { id: 'a15', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl6', subjectId: 's43', createdAt: new Date().toISOString() },
      { id: 'a16', schoolId: '2', academicYearId: 'y2024_2', classroomId: 'cl7', subjectId: 's51', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't9',
    name: 'Prof. Igor Ferreira',
    email: 'igor.ferreira@prof.edu.gov',
    subject: 'Física',
    phone: '(11) 91234-5686',
    status: 'active',
    cpf: '901.234.567-88',
    employmentBond: 'Efetivo',
    admissionDate: '2021-02-01',
    role: 'Professor II',
    academicBackground: 'Licenciatura em Física pela USP. Mestrado em Ensino de Física.',
    allocations: [
      { id: 'a17', schoolId: '3', academicYearId: 'y2024_3', classroomId: 'cl9', subjectId: 's70', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 't10',
    name: 'Prof. Juliana Martins',
    email: 'juliana.martins@prof.edu.gov',
    subject: 'Química',
    phone: '(11) 91234-5687',
    status: 'active',
    cpf: '012.345.678-99',
    employmentBond: 'Efetivo',
    admissionDate: '2020-02-01',
    role: 'Professor II',
    academicBackground: 'Licenciatura em Química pela UNICAMP.',
    allocations: [
      { id: 'a18', schoolId: '3', academicYearId: 'y2024_3', classroomId: 'cl9', subjectId: 's71', createdAt: new Date().toISOString() },
    ],
  },
]

// ============================================
// ALUNOS EXPANDIDOS
// ============================================

export const expandedMockStudents: Student[] = [
  {
    id: 's1',
    registration: 'EDU-2024001',
    name: 'Alice Souza',
    cpf: '111.222.333-44',
    birthDate: '2013-05-15',
    fatherName: 'Roberto Souza',
    motherName: 'Maria Souza',
    guardian: 'Roberto Souza',
    address: {
      street: 'Rua das Acácias',
      number: '45',
      neighborhood: 'Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
    },
    contacts: {
      phone: '(11) 98765-4321',
      email: 'alice.souza@aluno.edu.gov',
    },
    transport: { uses: true, routeNumber: 'Rota 05' },
    social: { nis: '12345678901', bolsaFamilia: false },
    health: { hasSpecialNeeds: false },
    enrollments: [
      { id: 'e1', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', grade: '5º Ano A', year: 2024, status: 'Cursando', type: 'regular' },
      { id: 'e2', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl2', grade: '1º Ano A', year: 2024, status: 'Cursando', type: 'dependency' },
    ],
    projectIds: ['p1'],
    grade: '5º Ano A',
    status: 'Cursando',
    email: 'alice.souza@aluno.edu.gov',
    phone: '(11) 98765-4321',
    susCard: '789456123000',
    nationality: 'Brasileira',
    raceColor: 'Parda',
    bloodType: 'O+',
    allergies: 'Nenhuma',
    receivesSchoolMeal: true,
    emergencyContact: {
      name: 'Roberto Souza',
      phone: '(11) 98765-4321',
      relationship: 'Pai',
    },
  },
  {
    id: 's2',
    registration: 'EDU-2024002',
    name: 'Bruno Silva',
    cpf: '222.333.444-55',
    birthDate: '2013-08-20',
    fatherName: 'Paulo Silva',
    motherName: 'Ana Silva',
    guardian: 'Paulo Silva',
    address: {
      street: 'Rua das Rosas',
      number: '78',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-890',
    },
    contacts: {
      phone: '(11) 98765-4322',
      email: 'bruno.silva@aluno.edu.gov',
    },
    transport: { uses: false },
    social: { nis: '23456789012', bolsaFamilia: true },
    health: { hasSpecialNeeds: false },
    enrollments: [
      { id: 'e3', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl1', grade: '5º Ano A', year: 2024, status: 'Cursando', type: 'regular' },
    ],
    projectIds: [],
    grade: '5º Ano A',
    status: 'Cursando',
    email: 'bruno.silva@aluno.edu.gov',
    phone: '(11) 98765-4322',
    susCard: '789456123001',
    nationality: 'Brasileira',
    raceColor: 'Branca',
    bloodType: 'A+',
    allergies: 'Lactose',
    receivesSchoolMeal: true,
    emergencyContact: {
      name: 'Paulo Silva',
      phone: '(11) 98765-4322',
      relationship: 'Pai',
    },
  },
  {
    id: 's3',
    registration: 'EDU-2024003',
    name: 'Carla Mendes',
    cpf: '333.444.555-66',
    birthDate: '2014-02-10',
    fatherName: 'José Mendes',
    motherName: 'Lucia Mendes',
    guardian: 'Lucia Mendes',
    address: {
      street: 'Av. Principal',
      number: '123',
      neighborhood: 'Vila Nova',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-123',
    },
    contacts: {
      phone: '(11) 98765-4323',
      email: 'carla.mendes@aluno.edu.gov',
    },
    transport: { uses: true, routeNumber: 'Rota 03' },
    social: { nis: '34567890123', bolsaFamilia: false },
    health: { hasSpecialNeeds: false },
    enrollments: [
      { id: 'e4', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl2', grade: '1º Ano A', year: 2024, status: 'Cursando', type: 'regular' },
    ],
    projectIds: [],
    grade: '1º Ano A',
    status: 'Cursando',
    email: 'carla.mendes@aluno.edu.gov',
    phone: '(11) 98765-4323',
    susCard: '789456123002',
    nationality: 'Brasileira',
    raceColor: 'Parda',
    bloodType: 'B+',
    allergies: 'Nenhuma',
    receivesSchoolMeal: true,
    emergencyContact: {
      name: 'Lucia Mendes',
      phone: '(11) 98765-4323',
      relationship: 'Mãe',
    },
  },
  {
    id: 's4',
    registration: 'EDU-2024004',
    name: 'Diego Oliveira',
    cpf: '444.555.666-77',
    birthDate: '2012-11-25',
    fatherName: 'Marcos Oliveira',
    motherName: 'Patricia Oliveira',
    guardian: 'Marcos Oliveira',
    address: {
      street: 'Rua dos Lírios',
      number: '90',
      neighborhood: 'Jardim das Flores',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-234',
    },
    contacts: {
      phone: '(11) 98765-4324',
      email: 'diego.oliveira@aluno.edu.gov',
    },
    transport: { uses: true, routeNumber: 'Rota 07' },
    social: { nis: '45678901234', bolsaFamilia: false },
    health: { hasSpecialNeeds: false },
    enrollments: [
      { id: 'e5', schoolId: '1', academicYearId: 'y2024', classroomId: 'cl6', grade: '6º Ano A', year: 2024, status: 'Cursando', type: 'regular' },
    ],
    projectIds: ['p1'],
    grade: '6º Ano A',
    status: 'Cursando',
    email: 'diego.oliveira@aluno.edu.gov',
    phone: '(11) 98765-4324',
    susCard: '789456123003',
    nationality: 'Brasileira',
    raceColor: 'Branca',
    bloodType: 'AB+',
    allergies: 'Nenhuma',
    receivesSchoolMeal: true,
    emergencyContact: {
      name: 'Marcos Oliveira',
      phone: '(11) 98765-4324',
      relationship: 'Pai',
    },
  },
  {
    id: 's5',
    registration: 'EDU-2024005',
    name: 'Eduarda Costa',
    cpf: '555.666.777-88',
    birthDate: '2011-03-18',
    fatherName: 'Ricardo Costa',
    motherName: 'Fernanda Costa',
    guardian: 'Fernanda Costa',
    address: {
      street: 'Rua das Palmeiras',
      number: '156',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-345',
    },
    contacts: {
      phone: '(11) 98765-4325',
      email: 'eduarda.costa@aluno.edu.gov',
    },
    transport: { uses: false },
    social: { nis: '56789012345', bolsaFamilia: true },
    health: { hasSpecialNeeds: true, cid: 'F84.0', specialNeedsDetails: ['TEA - Transtorno do Espectro Autista'] },
    enrollments: [
      { id: 'e6', schoolId: '2', academicYearId: 'y2024_2', classroomId: 'cl7', grade: '7º Ano A', year: 2024, status: 'Cursando', type: 'regular' },
    ],
    projectIds: [],
    grade: '7º Ano A',
    status: 'Cursando',
    email: 'eduarda.costa@aluno.edu.gov',
    phone: '(11) 98765-4325',
    susCard: '789456123004',
    nationality: 'Brasileira',
    raceColor: 'Branca',
    bloodType: 'O-',
    allergies: 'Nenhuma',
    receivesSchoolMeal: true,
    emergencyContact: {
      name: 'Fernanda Costa',
      phone: '(11) 98765-4325',
      relationship: 'Mãe',
    },
  },
  {
    id: 's6',
    registration: 'EDU-2024006',
    name: 'Felipe Santos',
    cpf: '666.777.888-99',
    birthDate: '2010-07-12',
    fatherName: 'Antonio Santos',
    motherName: 'Mariana Santos',
    guardian: 'Antonio Santos',
    address: {
      street: 'Av. dos Estudantes',
      number: '200',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-456',
    },
    contacts: {
      phone: '(11) 98765-4326',
      email: 'felipe.santos@aluno.edu.gov',
    },
    transport: { uses: true, routeNumber: 'Rota 10' },
    social: { nis: '67890123456', bolsaFamilia: false },
    health: { hasSpecialNeeds: false },
    enrollments: [
      { id: 'e7', schoolId: '3', academicYearId: 'y2024_3', classroomId: 'cl9', grade: '1º Ano EM A', year: 2024, status: 'Cursando', type: 'regular' },
    ],
    projectIds: [],
    grade: '1º Ano EM A',
    status: 'Cursando',
    email: 'felipe.santos@aluno.edu.gov',
    phone: '(11) 98765-4326',
    susCard: '789456123005',
    nationality: 'Brasileira',
    raceColor: 'Parda',
    bloodType: 'A-',
    allergies: 'Nenhuma',
    receivesSchoolMeal: true,
    emergencyContact: {
      name: 'Antonio Santos',
      phone: '(11) 98765-4326',
      relationship: 'Pai',
    },
  },
]

// ============================================
// AVALIAÇÕES EXPANDIDAS
// ============================================

export const expandedMockAssessments: Assessment[] = [
  // Aluno 1 - 5º Ano A
  { id: 'as1', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', periodId: 'p1', type: 'numeric', category: 'regular', value: 5.5, date: '2024-04-10', assessmentTypeId: 'at1' },
  { id: 'as1_rec', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', periodId: 'p1', type: 'numeric', category: 'recuperation', value: 8.0, date: '2024-04-15', assessmentTypeId: 'at6', relatedAssessmentId: 'as1' },
  { id: 'as2', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', periodId: 'p2', type: 'numeric', category: 'regular', value: 7.0, date: '2024-06-20', assessmentTypeId: 'at1' },
  { id: 'as3', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's29', periodId: 'p1', type: 'numeric', category: 'regular', value: 9.5, date: '2024-04-12', assessmentTypeId: 'at1' },
  { id: 'as4', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's29', periodId: 'p2', type: 'numeric', category: 'regular', value: 8.5, date: '2024-06-22', assessmentTypeId: 'at1' },
  { id: 'as5', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's31', periodId: 'p1', type: 'numeric', category: 'regular', value: 7.5, date: '2024-04-14', assessmentTypeId: 'at1' },
  { id: 'as6', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's32', periodId: 'p1', type: 'numeric', category: 'regular', value: 8.0, date: '2024-04-16', assessmentTypeId: 'at1' },
  { id: 'as7', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's33', periodId: 'p1', type: 'numeric', category: 'regular', value: 9.0, date: '2024-04-18', assessmentTypeId: 'at1' },
  { id: 'as8', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's34', periodId: 'p1', type: 'numeric', category: 'regular', value: 8.5, date: '2024-04-20', assessmentTypeId: 'at1' },
  { id: 'as9', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's35', periodId: 'p1', type: 'numeric', category: 'regular', value: 10.0, date: '2024-04-22', assessmentTypeId: 'at1' },
  // Dependency Assessment (Math 1st Year)
  { id: 'as_dep1', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl2', subjectId: 's2', periodId: 'p1', type: 'numeric', category: 'regular', value: 4.5, date: '2024-04-10', assessmentTypeId: 'at1' },
  // Aluno 2 - 5º Ano A
  { id: 'as10', studentId: 's2', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', periodId: 'p1', type: 'numeric', category: 'regular', value: 8.5, date: '2024-04-10', assessmentTypeId: 'at1' },
  { id: 'as11', studentId: 's2', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's29', periodId: 'p1', type: 'numeric', category: 'regular', value: 9.0, date: '2024-04-12', assessmentTypeId: 'at1' },
  { id: 'as12', studentId: 's2', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's31', periodId: 'p1', type: 'numeric', category: 'regular', value: 8.0, date: '2024-04-14', assessmentTypeId: 'at1' },
  // Aluno 3 - 1º Ano A
  { id: 'as13', studentId: 's3', schoolId: '1', yearId: 'y2024', classroomId: 'cl2', subjectId: 's1', periodId: 'p1', type: 'numeric', category: 'regular', value: 9.5, date: '2024-04-10', assessmentTypeId: 'at1' },
  { id: 'as14', studentId: 's3', schoolId: '1', yearId: 'y2024', classroomId: 'cl2', subjectId: 's2', periodId: 'p1', type: 'numeric', category: 'regular', value: 9.0, date: '2024-04-12', assessmentTypeId: 'at1' },
  // Aluno 4 - 6º Ano A
  { id: 'as15', studentId: 's4', schoolId: '1', yearId: 'y2024', classroomId: 'cl6', subjectId: 's37', periodId: 'p1', type: 'numeric', category: 'regular', value: 7.5, date: '2024-04-10', assessmentTypeId: 'at1' },
  { id: 'as16', studentId: 's4', schoolId: '1', yearId: 'y2024', classroomId: 'cl6', subjectId: 's36', periodId: 'p1', type: 'numeric', category: 'regular', value: 8.0, date: '2024-04-12', assessmentTypeId: 'at1' },
  // Aluno 5 - 7º Ano A
  { id: 'as17', studentId: 's5', schoolId: '2', yearId: 'y2024_2', classroomId: 'cl7', subjectId: 's45', periodId: 'p1_2', type: 'numeric', category: 'regular', value: 6.5, date: '2024-04-10', assessmentTypeId: 'at1' },
  { id: 'as18', studentId: 's5', schoolId: '2', yearId: 'y2024_2', classroomId: 'cl7', subjectId: 's44', periodId: 'p1_2', type: 'numeric', category: 'regular', value: 7.0, date: '2024-04-12', assessmentTypeId: 'at1' },
  // Aluno 6 - 1º Ano EM A
  { id: 'as19', studentId: 's6', schoolId: '3', yearId: 'y2024_3', classroomId: 'cl9', subjectId: 's69', periodId: 'p1_3', type: 'numeric', category: 'regular', value: 8.5, date: '2024-04-10', assessmentTypeId: 'at1' },
  { id: 'as20', studentId: 's6', schoolId: '3', yearId: 'y2024_3', classroomId: 'cl9', subjectId: 's68', periodId: 'p1_3', type: 'numeric', category: 'regular', value: 9.0, date: '2024-04-12', assessmentTypeId: 'at1' },
]

// ============================================
// FREQUÊNCIA EXPANDIDA
// ============================================

export const expandedMockAttendance: AttendanceRecord[] = [
  { id: 'att1', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', date: '2024-04-10', present: true },
  { id: 'att2', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', date: '2024-04-11', present: true },
  { id: 'att3', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', date: '2024-04-12', present: false, justification: 'Atestado médico' },
  { id: 'att4', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', date: '2024-04-13', present: true },
  { id: 'att5', studentId: 's1', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', date: '2024-04-14', present: true },
  { id: 'att6', studentId: 's2', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', date: '2024-04-10', present: true },
  { id: 'att7', studentId: 's2', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', date: '2024-04-11', present: true },
  { id: 'att8', studentId: 's2', schoolId: '1', yearId: 'y2024', classroomId: 'cl1', subjectId: 's30', date: '2024-04-12', present: true },
  { id: 'att9', studentId: 's3', schoolId: '1', yearId: 'y2024', classroomId: 'cl2', subjectId: 's1', date: '2024-04-10', present: true },
  { id: 'att10', studentId: 's3', schoolId: '1', yearId: 'y2024', classroomId: 'cl2', subjectId: 's1', date: '2024-04-11', present: true },
]

// ============================================
// OCORRÊNCIAS EXPANDIDAS
// ============================================

export const expandedMockOccurrences: Occurrence[] = [
  {
    id: 'occ1',
    studentId: 's1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    date: '2024-04-10',
    type: 'behavior',
    description: 'Aluno apresentou comportamento exemplar na atividade em grupo.',
    recordedBy: 'Prof. Alberto Campos',
    createdAt: '2024-04-10T10:00:00Z',
  },
  {
    id: 'occ2',
    studentId: 's2',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    date: '2024-04-12',
    type: 'pedagogical',
    description: 'Aluno demonstrou grande interesse e participação na aula de Ciências.',
    recordedBy: 'Prof. Daniela Santos',
    createdAt: '2024-04-12T14:30:00Z',
  },
  {
    id: 'occ3',
    studentId: 's1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    date: '2024-04-15',
    type: 'behavior',
    description: 'Aluno precisa melhorar a atenção durante as explicações.',
    recordedBy: 'Prof. Beatriz Oliveira',
    createdAt: '2024-04-15T09:15:00Z',
  },
]

// ============================================
// FUNCIONÁRIOS EXPANDIDOS
// ============================================

export const expandedMockStaff: Staff[] = [
  {
    id: 'st1',
    name: 'Ana Paula Costa',
    cpf: '111.222.333-44',
    email: 'ana.costa@edu.gov',
    phone: '(11) 3456-7890',
    role: 'director',
    roleLabel: 'Diretora',
    schoolId: '1',
    admissionDate: '2018-01-15',
    employmentBond: 'Efetivo',
    contractType: 'Estatutário',
    functionalSituation: 'efetivo',
    workload: 40,
    status: 'active',
    address: {
      street: 'Rua das Diretoras',
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-000',
    },
    emergencyContact: {
      name: 'João Costa',
      phone: '(11) 98765-1111',
      relationship: 'Cônjuge',
    },
    qualifications: ['Pedagogia', 'Gestão Escolar'],
    createdAt: '2018-01-15T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'st2',
    name: 'Roberto Silva',
    cpf: '222.333.444-55',
    email: 'roberto.silva@edu.gov',
    phone: '(11) 3456-7891',
    role: 'secretary',
    roleLabel: 'Secretário',
    schoolId: '1',
    admissionDate: '2019-03-01',
    employmentBond: 'Efetivo',
    contractType: 'Estatutário',
    functionalSituation: 'efetivo',
    workload: 40,
    status: 'active',
    address: {
      street: 'Rua dos Secretários',
      number: '200',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-001',
    },
    emergencyContact: {
      name: 'Maria Silva',
      phone: '(11) 98765-2222',
      relationship: 'Cônjuge',
    },
    qualifications: ['Administração'],
    createdAt: '2019-03-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'st3',
    name: 'Lucia Santos',
    cpf: '333.444.555-66',
    email: 'lucia.santos@edu.gov',
    phone: '(11) 3456-7892',
    role: 'coordinator',
    roleLabel: 'Coordenadora Pedagógica',
    schoolId: '1',
    admissionDate: '2020-02-01',
    employmentBond: 'Efetivo',
    contractType: 'Estatutário',
    functionalSituation: 'efetivo',
    workload: 40,
    status: 'active',
    address: {
      street: 'Rua das Coordenadoras',
      number: '300',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-002',
    },
    emergencyContact: {
      name: 'Carlos Santos',
      phone: '(11) 98765-3333',
      relationship: 'Cônjuge',
    },
    qualifications: ['Pedagogia', 'Coordenação Pedagógica'],
    createdAt: '2020-02-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'st4',
    name: 'Pedro Alves',
    cpf: '444.555.666-77',
    email: 'pedro.alves@edu.gov',
    phone: '(11) 3456-7893',
    role: 'janitor',
    roleLabel: 'Zelador',
    schoolId: '1',
    admissionDate: '2021-01-10',
    employmentBond: 'Terceirizado',
    contractType: 'Terceirizado',
    functionalSituation: 'terceirizado',
    workload: 40,
    status: 'active',
    address: {
      street: 'Rua dos Zeladores',
      number: '400',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-003',
    },
    emergencyContact: {
      name: 'Fernanda Alves',
      phone: '(11) 98765-4444',
      relationship: 'Cônjuge',
    },
    qualifications: [],
    createdAt: '2021-01-10T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'st5',
    name: 'Mariana Costa',
    cpf: '555.666.777-88',
    email: 'mariana.costa@edu.gov',
    phone: '(11) 3456-7894',
    role: 'cook',
    roleLabel: 'Merendeira',
    schoolId: '1',
    admissionDate: '2020-08-01',
    employmentBond: 'Efetivo',
    contractType: 'Estatutário',
    functionalSituation: 'efetivo',
    workload: 40,
    status: 'active',
    address: {
      street: 'Rua das Merendeiras',
      number: '500',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-004',
    },
    emergencyContact: {
      name: 'Ricardo Costa',
      phone: '(11) 98765-5555',
      relationship: 'Cônjuge',
    },
    qualifications: ['Curso de Manipulação de Alimentos'],
    createdAt: '2020-08-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// ============================================
// PROTOCOLOS EXPANDIDOS
// ============================================

export const expandedMockProtocols: Protocol[] = [
  {
    id: 'prot1',
    number: 'PROT-2024-001',
    type: 'matricula',
    requester: {
      name: 'Roberto Souza',
      cpf: '111.222.333-44',
      phone: '(11) 98765-4321',
      email: 'roberto.souza@email.com',
      relationship: 'pai',
    },
    studentId: 's1',
    schoolId: '1',
    description: 'Solicitação de matrícula para o ano letivo de 2024',
    status: 'completed',
    priority: 'normal',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    completedAt: '2024-01-20T14:30:00Z',
    assignedTo: 'st2',
    documents: [
      {
        id: 'doc1',
        type: 'declaracao_matricula',
        status: 'delivered',
        requestedAt: '2024-01-15T08:00:00Z',
        readyAt: '2024-01-18T10:00:00Z',
        deliveredAt: '2024-01-20T14:30:00Z',
        preparedBy: 'st2',
        fileUrl: '#',
      },
    ],
    history: [
      {
        id: 'hist1',
        action: 'created',
        description: 'Protocolo criado',
        userId: 'st2',
        timestamp: '2024-01-15T08:00:00Z',
      },
      {
        id: 'hist2',
        action: 'completed',
        description: 'Protocolo concluído e documento entregue',
        userId: 'st2',
        timestamp: '2024-01-20T14:30:00Z',
      },
    ],
  },
  {
    id: 'prot2',
    number: 'PROT-2024-002',
    type: 'transferencia',
    requester: {
      name: 'Paulo Silva',
      cpf: '222.333.444-55',
      phone: '(11) 98765-4322',
      email: 'paulo.silva@email.com',
      relationship: 'pai',
    },
    studentId: 's2',
    schoolId: '1',
    description: 'Solicitação de transferência para outra escola',
    status: 'in_progress',
    priority: 'normal',
    createdAt: '2024-01-25T09:00:00Z',
    updatedAt: '2024-01-25T09:00:00Z',
    assignedTo: 'st2',
    documents: [],
    history: [
      {
        id: 'hist3',
        action: 'created',
        description: 'Protocolo criado',
        userId: 'st2',
        timestamp: '2024-01-25T09:00:00Z',
      },
    ],
  },
]

// ============================================
// AGENDAMENTOS EXPANDIDOS
// ============================================

export const expandedMockAppointments: Appointment[] = [
  {
    id: 'app1',
    protocolId: 'prot1',
    schoolId: '1',
    requester: {
      name: 'Roberto Souza',
      cpf: '111.222.333-44',
      phone: '(11) 98765-4321',
      email: 'roberto.souza@email.com',
    },
    type: 'matricula',
    date: '2024-01-20',
    time: '14:00',
    status: 'completed',
    notes: 'Reunião realizada com sucesso',
    confirmedAt: '2024-01-19T10:00:00Z',
    reminderSent: true,
  },
  {
    id: 'app2',
    schoolId: '1',
    requester: {
      name: 'Paulo Silva',
      cpf: '222.333.444-55',
      phone: '(11) 98765-4322',
      email: 'paulo.silva@email.com',
    },
    type: 'documentos',
    date: '2024-02-05',
    time: '10:00',
    status: 'scheduled',
    notes: 'Solicitação de documentos escolares',
    reminderSent: false,
  },
]

// ============================================
// FILA DE ATENDIMENTO EXPANDIDA
// ============================================

export interface QueueItem {
  id: string
  protocolId?: string
  requester: {
    name: string
    cpf: string
    phone: string
  }
  type: 'matricula' | 'documentos' | 'informacoes' | 'outros'
  priority: 'normal' | 'preferential' | 'urgent'
  status: 'waiting' | 'in_service' | 'completed'
  createdAt: string
  startedAt?: string
  completedAt?: string
  servedBy?: string
  notes?: string
}

export const expandedMockQueue: QueueItem[] = [
  {
    id: 'q1',
    protocolId: 'prot1',
    requester: {
      name: 'Roberto Souza',
      cpf: '111.222.333-44',
      phone: '(11) 98765-4321',
    },
    type: 'matricula',
    priority: 'normal',
    status: 'completed',
    createdAt: '2024-01-20T13:45:00Z',
    startedAt: '2024-01-20T14:00:00Z',
    completedAt: '2024-01-20T14:30:00Z',
    servedBy: 'st2',
    notes: 'Atendimento concluído com sucesso',
  },
  {
    id: 'q2',
    requester: {
      name: 'Paulo Silva',
      cpf: '222.333.444-55',
      phone: '(11) 98765-4322',
    },
    type: 'documentos',
    priority: 'normal',
    status: 'waiting',
    createdAt: '2024-01-25T09:00:00Z',
  },
]

// ============================================
// DOCUMENTOS ESCOLARES EXPANDIDOS
// ============================================

export const expandedMockSchoolDocuments: SchoolDocument[] = [
  {
    id: 'doc1',
    type: 'declaracao_matricula',
    studentId: 's1',
    schoolId: '1',
    academicYearId: 'y2024',
    classroomId: 'cl1',
    protocolNumber: 'PROT-2024-001',
    content: {
      studentName: 'Alice Souza',
      registration: 'EDU-2024001',
      schoolName: 'Escola Municipal Monteiro Lobato',
      grade: '5º Ano A',
      year: '2024',
    },
    generatedAt: '2024-01-18T10:00:00Z',
    generatedBy: 'st2',
    status: 'issued',
    signedBy: 'st1',
    signedAt: '2024-01-18T10:30:00Z',
    pdfUrl: '#',
    sequentialNumber: 1,
  },
]

// ============================================
// NOTÍCIAS EXPANDIDAS
// ============================================

export const expandedMockNews: NewsPost[] = [
  {
    id: 'n1',
    title: 'Volta às Aulas 2025',
    summary: 'Prefeitura anuncia calendário para o retorno das atividades escolares.',
    content: '<p>A Secretaria de Educação informa que o retorno às aulas está previsto para o dia 05 de fevereiro. Todas as escolas já estão preparadas para receber os alunos com segurança e novidades na infraestrutura.</p><p>Os pais devem ficar atentos aos comunicados específicos de cada unidade escolar sobre horários e materiais.</p>',
    publishDate: new Date().toISOString(),
    author: 'Ascom SEMED',
    imageUrl: 'https://img.usecurling.com/p/800/600?q=classroom',
    active: true,
  },
  {
    id: 'n2',
    title: 'Reformas nas Escolas Municipais',
    summary: 'Três unidades escolares passam por ampliação e melhorias.',
    content: '<p>As escolas Monteiro Lobato, Cecília Meireles e Vinícius de Moraes estão recebendo obras de manutenção, pintura e climatização das salas de aula.</p><p>O investimento visa proporcionar um ambiente mais adequado para o aprendizado e bem-estar de todos os estudantes e servidores.</p>',
    publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    author: 'Ascom Prefeitura',
    imageUrl: 'https://img.usecurling.com/p/800/600?q=school%20renovation',
    active: true,
  },
  {
    id: 'n3',
    title: 'Inscrições Abertas para Cursos de Formação',
    summary: 'Professores podem se inscrever em cursos de capacitação.',
    content: '<p>A Secretaria de Educação está com inscrições abertas para cursos de formação continuada para professores da rede municipal.</p><p>Os cursos abordarão temas como metodologias ativas, tecnologias educacionais e inclusão escolar.</p>',
    publishDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    author: 'Ascom SEMED',
    imageUrl: 'https://img.usecurling.com/p/800/600?q=teacher%20training',
    active: true,
  },
]

// ============================================
// DOCUMENTOS PÚBLICOS EXPANDIDOS
// ============================================

export const expandedMockPublicDocuments: PublicDocument[] = [
  {
    id: 'pd1',
    organ: 'SEMED',
    documentNumber: '001/2024',
    year: '2024',
    publishDate: '2024-01-15',
    summary: 'Estabelece o Calendário Escolar para o ano letivo de 2024.',
    theme: 'Calendário Escolar',
    driveLink: '#',
    active: true,
  },
  {
    id: 'pd2',
    organ: 'Prefeitura Municipal',
    documentNumber: 'Decreto 123/2024',
    year: '2024',
    publishDate: '2024-01-10',
    summary: 'Nomeia a nova Secretária de Educação.',
    theme: 'Nomeação',
    driveLink: '#',
    active: true,
  },
  {
    id: 'pd3',
    organ: 'SEMED',
    documentNumber: 'Portaria 045/2024',
    year: '2024',
    publishDate: '2024-02-01',
    summary: 'Estabelece normas para matrícula no ano letivo de 2024.',
    theme: 'Matrícula',
    driveLink: '#',
    active: true,
  },
]

// ============================================
// CONTEÚDO INSTITUCIONAL EXPANDIDO
// ============================================

export const expandedMockInstitutionalContent: InstitutionalContent[] = [
  {
    section: 'semed_info',
    title: 'Sobre a SEMED',
    content: `<p>A Secretaria Municipal de Educação (SEMED) tem como missão garantir o acesso a um ensino de qualidade para todas as crianças, jovens e adultos do município, promovendo a formação integral dos estudantes e o desenvolvimento de competências necessárias para a vida em sociedade.</p>
    
    <h3>Nossos Valores</h3>
    <ul>
      <li><strong>Ética:</strong> Transparência e integridade em todas as ações</li>
      <li><strong>Inovação:</strong> Busca constante por metodologias e tecnologias educacionais</li>
      <li><strong>Valorização:</strong> Reconhecimento e desenvolvimento dos profissionais da educação</li>
      <li><strong>Inclusão:</strong> Garantia de acesso e permanência para todos os estudantes</li>
      <li><strong>Qualidade:</strong> Compromisso com a excelência no ensino e aprendizagem</li>
    </ul>
    
    <h3>Nossa História</h3>
    <p>A SEMED foi criada com o objetivo de centralizar e organizar as políticas educacionais do município, trabalhando em conjunto com as unidades escolares para garantir uma educação pública de qualidade. Ao longo dos anos, temos investido em infraestrutura, formação de professores e programas educacionais inovadores.</p>
    
    <h3>Nossos Números</h3>
    <ul>
      <li>Mais de 15.000 estudantes matriculados</li>
      <li>Mais de 1.200 profissionais da educação</li>
      <li>Mais de 50 unidades escolares</li>
      <li>Cobertura de 100% das crianças em idade escolar</li>
    </ul>`,
    updatedAt: new Date().toISOString(),
  },
  {
    section: 'semed_structure',
    title: 'Estrutura Organizacional',
    content: `<p>A SEMED está estruturada em departamentos especializados que trabalham de forma integrada para garantir o sucesso das políticas educacionais do município.</p>
    
    <h3>Departamentos</h3>
    
    <h4>Departamento Pedagógico</h4>
    <p>Responsável pelo planejamento, coordenação e acompanhamento das ações pedagógicas nas escolas. Atua na formação continuada de professores, desenvolvimento de currículos e avaliação do processo de ensino e aprendizagem.</p>
    
    <h4>Departamento Administrativo</h4>
    <p>Gerencia os recursos humanos, materiais e financeiros da secretaria e das escolas. Responsável pela gestão de pessoal, compras, licitações e manutenção da infraestrutura escolar.</p>
    
    <h4>Departamento Financeiro</h4>
    <p>Planeja e executa o orçamento educacional, garantindo a aplicação correta dos recursos públicos. Responsável pela prestação de contas e transparência na gestão financeira.</p>
    
    <h4>Departamento de Tecnologia e Inovação</h4>
    <p>Desenvolve e implementa soluções tecnológicas para modernizar a gestão educacional e o processo de ensino e aprendizagem. Responsável pelos sistemas de informação, plataformas digitais e infraestrutura tecnológica.</p>
    
    <h3>Equipe Multidisciplinar</h3>
    <p>Contamos com uma equipe formada por pedagogos, administradores, contadores, técnicos em tecnologia, psicólogos, assistentes sociais e outros profissionais especializados, todos focados no suporte às escolas e no desenvolvimento de políticas públicas educacionais efetivas.</p>
    
    <h3>Atuação nas Escolas</h3>
    <p>Cada escola conta com uma equipe de gestão composta por diretor, vice-diretor, coordenador pedagógico e secretário escolar, que trabalham em conjunto com os professores e demais profissionais para garantir a qualidade do ensino oferecido.</p>`,
    updatedAt: new Date().toISOString(),
  },
]

