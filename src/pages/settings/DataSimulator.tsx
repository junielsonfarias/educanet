import { useState } from 'react'
import {
  Database,
  RefreshCw,
  Users,
  GraduationCap,
  School,
  Check,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import useSchoolStore from '@/stores/useSchoolStore'
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useCourseStore from '@/stores/useCourseStore'
import { useToast } from '@/hooks/use-toast'
import {
  Assessment,
  AcademicYear,
  Classroom,
  Student,
  Enrollment,
  AttendanceRecord,
} from '@/lib/mock-data'
import { addDays, format, parseISO } from 'date-fns'

export default function DataSimulator() {
  const { schools, addAcademicYear, addClassroom } = useSchoolStore()
  const { addStudent } = useStudentStore()
  const { addAssessment, assessmentTypes } = useAssessmentStore()
  const { courses } = useCourseStore()
  const { toast } = useToast()

  const [studentCount, setStudentCount] = useState(20)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const firstNames = [
    'Ana',
    'Bruno',
    'Carlos',
    'Daniela',
    'Eduardo',
    'Fernanda',
    'Gabriel',
    'Helena',
    'Igor',
    'Julia',
    'Lucas',
    'Mariana',
    'Nicolas',
    'Olivia',
    'Pedro',
    'Rafaela',
    'Samuel',
    'Tatiana',
    'Vinicius',
    'Yasmin',
  ]
  const lastNames = [
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Rodrigues',
    'Ferreira',
    'Alves',
    'Pereira',
    'Lima',
    'Gomes',
    'Costa',
    'Ribeiro',
    'Martins',
    'Carvalho',
    'Almeida',
    'Lopes',
    'Soares',
    'Fernandes',
    'Vieira',
    'Monteiro',
  ]

  const generateName = () => {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)]
    const last = lastNames[Math.floor(Math.random() * lastNames.length)]
    const last2 = lastNames[Math.floor(Math.random() * lastNames.length)]
    return `${first} ${last} ${last2}`
  }

  const handleGenerate = async () => {
    if (!schools.length || !courses.length) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description:
          'É necessário ter pelo menos uma escola e um curso cadastrados.',
      })
      return
    }

    setLoading(true)
    setProgress(10)

    try {
      // 1. Setup Environment (Year & Class)
      const targetSchool = schools[0] // Simulate for first school
      const targetCourse = courses[0] // Simulate for first course
      const targetGrade = targetCourse.grades[0] // First grade of first course

      if (!targetGrade || targetGrade.subjects.length === 0) {
        throw new Error('O curso selecionado não possui disciplinas.')
      }

      // Check if year exists, else create
      let yearId =
        targetSchool.academicYears[targetSchool.academicYears.length - 1]?.id
      let periods =
        targetSchool.academicYears[targetSchool.academicYears.length - 1]
          ?.periods || []

      if (!yearId) {
        if (targetSchool.academicYears.length === 0) {
          throw new Error(
            'Crie um ano letivo manualmente na escola antes de simular.',
          )
        }
      }

      const activeYear = targetSchool.academicYears.find((y) => y.id === yearId)
      periods = activeYear?.periods || []

      // Create a Simulation Class
      const classId = Math.random().toString(36).substr(2, 9)
      const className = `Simulação ${Math.floor(Math.random() * 1000)}`

      addClassroom(targetSchool.id, yearId, {
        name: className,
        shift: 'Matutino',
        gradeId: targetGrade.id,
        isMultiGrade: false,
      })

      setProgress(30)

      // 2. Generate Students, Enrollments, Grades & Attendance
      const currentStudents = JSON.parse(
        localStorage.getItem('edu_students') || '[]',
      )
      const currentAssessments = JSON.parse(
        localStorage.getItem('edu_assessments') || '[]',
      )
      const currentAttendance = JSON.parse(
        localStorage.getItem('edu_attendance') || '[]',
      )

      const newStudents: Student[] = []
      const newAssessments: Assessment[] = []
      const newAttendance: AttendanceRecord[] = []

      // Generate Students
      for (let i = 0; i < studentCount; i++) {
        const id = Math.random().toString(36).substr(2, 9)
        const name = generateName()
        const registration = `SIM-${Math.floor(Math.random() * 100000)}`

        const newStudent: Student = {
          id,
          name,
          registration,
          guardian: generateName(),
          birthDate: '2015-01-01',
          grade: className, // Legacy
          status: 'Cursando',
          email: '',
          phone: '',
          address: {
            street: 'Rua Sim',
            number: '1',
            neighborhood: 'Bairro',
            city: 'Cidade',
            state: 'SP',
            zipCode: '00000-000',
          },
          contacts: { phone: '', email: '' },
          social: { nis: '', bolsaFamilia: false },
          transport: { uses: false },
          health: { hasSpecialNeeds: false },
          enrollments: [
            {
              id: Math.random().toString(36).substr(2, 9),
              schoolId: targetSchool.id,
              year: parseInt(activeYear?.name || '2024'),
              grade: className,
              status: 'Cursando',
              type: 'regular',
            },
          ],
          projectIds: [],
        }
        newStudents.push(newStudent)

        // Generate Assessments & Attendance for this student
        if (activeYear?.periods && targetGrade.subjects) {
          activeYear.periods.forEach((period) => {
            targetGrade.subjects.forEach((subject) => {
              // 1. Regular Assessment
              const typeId = assessmentTypes[0]?.id // Use first type
              const regValue = (Math.random() * 10).toFixed(1)
              const regId = Math.random().toString(36).substr(2, 9)

              newAssessments.push({
                id: regId,
                studentId: id,
                schoolId: targetSchool.id,
                yearId: activeYear.id,
                classroomId: classId,
                periodId: period.id,
                subjectId: subject.id,
                type: 'numeric',
                category: 'regular',
                value: regValue,
                date: period.startDate,
                assessmentTypeId: typeId,
              })

              // 2. Recovery (Chance of needing it)
              if (Number(regValue) < 6 && Math.random() > 0.3) {
                const recValue = (
                  Number(regValue) +
                  Math.random() * (10 - Number(regValue))
                ).toFixed(1)
                const recId = Math.random().toString(36).substr(2, 9)

                newAssessments.push({
                  id: recId,
                  studentId: id,
                  schoolId: targetSchool.id,
                  yearId: activeYear.id,
                  classroomId: classId,
                  periodId: period.id,
                  subjectId: subject.id,
                  type: 'numeric',
                  category: 'recuperation',
                  value: recValue,
                  date: period.endDate,
                  assessmentTypeId: typeId,
                  relatedAssessmentId: regId,
                })
              }

              // 3. Generate Attendance (Simulate 5 random days per period)
              // Simplified: assume 5 distinct days for this subject in this period
              for (let d = 0; d < 5; d++) {
                const attendanceDate = addDays(
                  parseISO(period.startDate),
                  d * 7 + 2, // Spread out weekly
                )
                // 10% chance of absence
                const isAbsent = Math.random() < 0.1
                newAttendance.push({
                  id: Math.random().toString(36).substr(2, 9),
                  studentId: id,
                  schoolId: targetSchool.id,
                  yearId: activeYear.id,
                  classroomId: classId,
                  subjectId: subject.id,
                  date: format(attendanceDate, 'yyyy-MM-dd'),
                  present: !isAbsent,
                  justification: isAbsent
                    ? Math.random() > 0.5
                      ? 'Atestado Médico'
                      : undefined
                    : undefined,
                })
              }
            })
          })
        }
      }

      // We need to inject the class we created earlier properly
      const currentSchools = JSON.parse(
        localStorage.getItem('edu_schools') || '[]',
      )
      const updatedSchools = currentSchools.map((s: any) => {
        if (s.id === targetSchool.id) {
          return {
            ...s,
            academicYears: s.academicYears.map((y: any) => {
              if (y.id === activeYear?.id) {
                return {
                  ...y,
                  classes: [
                    ...y.classes,
                    {
                      id: classId,
                      name: className,
                      shift: 'Matutino',
                      gradeId: targetGrade.id,
                      gradeName: targetGrade.name,
                      studentCount: studentCount,
                      isMultiGrade: false,
                    },
                  ],
                }
              }
              return y
            }),
          }
        }
        return s
      })

      // Commit to LocalStorage
      localStorage.setItem(
        'edu_students',
        JSON.stringify([...currentStudents, ...newStudents]),
      )
      localStorage.setItem(
        'edu_assessments',
        JSON.stringify([...currentAssessments, ...newAssessments]),
      )
      localStorage.setItem(
        'edu_attendance',
        JSON.stringify([...currentAttendance, ...newAttendance]),
      )
      localStorage.setItem('edu_schools', JSON.stringify(updatedSchools))

      setProgress(100)
      toast({
        title: 'Simulação Concluída',
        description: `${studentCount} alunos gerados com histórico acadêmico e de frequência completo. Recarregando...`,
      })

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (e) {
      console.error(e)
      toast({
        variant: 'destructive',
        title: 'Erro na Simulação',
        description: 'Não foi possível gerar os dados.',
      })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Gerador de Dados (Simulação)
        </h2>
        <p className="text-muted-foreground">
          Ferramenta para popular o sistema com dados fictícios para testes de
          performance, cálculo de notas e frequência.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração da Simulação</CardTitle>
          <CardDescription>
            Gere uma turma completa com alunos, matrículas, notas (com
            recuperações) e frequência.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 max-w-sm">
            <div className="space-y-2">
              <Label>Quantidade de Alunos na Turma</Label>
              <Input
                type="number"
                min={5}
                max={50}
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-secondary/20 p-4 rounded-md space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" /> O que será gerado?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                Uma nova turma ("Simulação X") na primeira escola cadastrada.
              </li>
              <li>
                {studentCount} Alunos com dados pessoais e matrículas ativas.
              </li>
              <li>
                Notas lançadas para todas as disciplinas do primeiro curso.
              </li>
              <li>
                <span className="text-primary font-medium">
                  Notas de Recuperação
                </span>{' '}
                vinculadas especificamente às avaliações originais.
              </li>
              <li>
                <span className="text-primary font-medium">
                  Registros de Frequência
                </span>{' '}
                (Presenças e Faltas) gerados automaticamente para todas as
                disciplinas.
              </li>
            </ul>
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Gerando dados...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button disabled={loading} onClick={handleGenerate}>
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Processando...' : 'Iniciar Simulação'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cenários de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border p-4 rounded-lg flex flex-col items-center text-center gap-2">
              <Users className="h-8 w-8 text-blue-500" />
              <span className="font-semibold">Volume de Dados</span>
              <p className="text-xs text-muted-foreground">
                Teste a performance das listagens com múltiplas turmas geradas.
              </p>
            </div>
            <div className="border p-4 rounded-lg flex flex-col items-center text-center gap-2">
              <GraduationCap className="h-8 w-8 text-green-500" />
              <span className="font-semibold">Cálculo de Notas</span>
              <p className="text-xs text-muted-foreground">
                Valide se a média final considera corretamente as recuperações
                vinculadas.
              </p>
            </div>
            <div className="border p-4 rounded-lg flex flex-col items-center text-center gap-2">
              <CalendarDays className="h-8 w-8 text-purple-500" />
              <span className="font-semibold">Frequência</span>
              <p className="text-xs text-muted-foreground">
                Verifique se o percentual de presença é calculado corretamente.
              </p>
            </div>
            <div className="border p-4 rounded-lg flex flex-col items-center text-center gap-2">
              <School className="h-8 w-8 text-orange-500" />
              <span className="font-semibold">Relatórios</span>
              <p className="text-xs text-muted-foreground">
                Verifique a consistência dos dados nos boletins e atas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
