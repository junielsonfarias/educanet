import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Calendar as CalendarIcon,
  Check,
  Save,
  AlertTriangle,
  MessageSquare,
  Clock,
  History,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast as sonnerToast } from 'sonner'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useAttendanceStore } from '@/stores/useAttendanceStore.supabase'
import useOccurrenceStore from '@/stores/useOccurrenceStore'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { 
  classService, 
  enrollmentService, 
  lessonService 
} from '@/lib/supabase/services'
import { useAuth } from '@/hooks/useAuth'

const formSchema = z.object({
  schoolId: z.string().min(1, 'Escola é obrigatória'),
  classId: z.string().min(1, 'Turma é obrigatória'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  subjectId: z.string().optional(),
})

export default function DigitalClassDiary() {
  const { schools, fetchSchools } = useSchoolStore()
  const { students, fetchStudents } = useStudentStore()
  const { 
    attendances, 
    loading: attendanceLoading,
    fetchClassAttendance,
    recordAttendanceBatch 
  } = useAttendanceStore()
  const { addOccurrence, getClassOccurrences } = useOccurrenceStore()
  const { courses, subjects, fetchCourses, fetchSubjects } = useCourseStore()
  const { userData } = useAuth()
  
  const [classes, setClasses] = useState<any[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [enrollments, setEnrollments] = useState<any[]>([])

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]) // IDs of PRESENT students
  const [justifications, setJustifications] = useState<Record<string, string>>(
    {},
  )
  const [activeTab, setActiveTab] = useState('attendance')

  // Occurrence State
  const [occurrenceType, setOccurrenceType] = useState('behavior')
  const [occurrenceDesc, setOccurrenceDesc] = useState('')
  const [occurrenceStudentId, setOccurrenceStudentId] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
    },
  })

  const schoolId = form.watch('schoolId')
  const classId = form.watch('classId')
  const date = form.watch('date')
  const subjectId = form.watch('subjectId')

  // Carregar dados iniciais
  useEffect(() => {
    fetchSchools()
    fetchStudents()
    fetchCourses()
    fetchSubjects()
  }, [fetchSchools, fetchStudents, fetchCourses, fetchSubjects])

  // Buscar turmas quando escola é selecionada
  useEffect(() => {
    const fetchClasses = async () => {
      if (schoolId) {
        setClassesLoading(true)
        try {
          const classesData = await classService.getBySchool(parseInt(schoolId))
          setClasses(classesData || [])
        } catch {
          sonnerToast.error('Erro ao carregar turmas')
          setClasses([])
        } finally {
          setClassesLoading(false)
        }
      } else {
        setClasses([])
      }
    }
    fetchClasses()
  }, [schoolId])

  // Buscar matrículas quando turma é selecionada
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (classId) {
        try {
          const enrollmentsData = await enrollmentService.getEnrollmentsByClass(parseInt(classId))
          setEnrollments(enrollmentsData || [])
        } catch {
          setEnrollments([])
        }
      } else {
        setEnrollments([])
      }
    }
    fetchEnrollments()
  }, [classId])

  // Filtrar disciplinas por curso da turma
  const selectedClass = classes.find((c) => c.id.toString() === classId)
  const filteredSubjects = useMemo(() => {
    if (!selectedClass?.course_id) return subjects || []
    return (subjects || []).filter((s) => s.course_id === selectedClass.course_id)
  }, [subjects, selectedClass])

  // Alunos da turma
  const classStudents = useMemo(() => {
    if (!enrollments.length) return []
    return enrollments
      .map((enrollment) => {
        const student = students.find((s) => s.id === enrollment.student_id)
        if (!student) return null
        return {
          id: student.id.toString(),
          name: `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim(),
          studentProfileId: student.id,
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  }, [enrollments, students])

  const classOccurrences = useMemo(() => {
    if (!classId) return []
    const all = getClassOccurrences(classId)
    // Filter by student if selected
    if (occurrenceStudentId) {
      return all.filter((o) => o.studentId === occurrenceStudentId)
    }
    return all.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [classId, occurrenceStudentId, getClassOccurrences])

  // Load attendance data when context changes
  useEffect(() => {
    const loadAttendance = async () => {
      if (!classId || !date) {
        setSelectedStudents([])
        setJustifications({})
        return
      }

      const dateStr = format(date, 'yyyy-MM-dd')
      
      try {
        // Buscar aulas da turma na data
        const lessons = await lessonService.getByClass(parseInt(classId))
        const lessonForDate = lessons.find((l) => {
          const lessonDate = l.lesson_date ? new Date(l.lesson_date).toISOString().split('T')[0] : null
          return lessonDate === dateStr && 
                 (!subjectId || l.class_teacher_subject?.subject_id?.toString() === subjectId)
        })

        if (lessonForDate) {
          // Buscar frequências da aula
          await fetchClassAttendance(parseInt(classId), { 
            date: dateStr,
            subjectId: subjectId ? parseInt(subjectId) : undefined
          })

          // Mapear frequências para estado
          const presentIds: string[] = []
          const justificationMap: Record<string, string> = {}
          
          attendances.forEach((attendance) => {
            const studentId = attendance.student_profile_id?.toString()
            if (!studentId) return
            
            if (attendance.status === 'Presente') {
              presentIds.push(studentId)
            } else if (attendance.notes) {
              justificationMap[studentId] = attendance.notes
            }
          })

          setSelectedStudents(presentIds)
          setJustifications(justificationMap)
        } else {
          // Default: All present if no lesson exists
          if (classStudents.length > 0) {
            setSelectedStudents(classStudents.map((s) => s.id))
            setJustifications({})
          }
        }
      } catch {
        // Default: All present on error
        if (classStudents.length > 0) {
          setSelectedStudents(classStudents.map((s) => s.id))
          setJustifications({})
        }
      }
    }

    loadAttendance()
  }, [classId, date, subjectId, classStudents, fetchClassAttendance, attendances])

  const togglePresence = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId))
    } else {
      setSelectedStudents((prev) => [...prev, studentId])
      // Clear justification if present
      const newJust = { ...justifications }
      delete newJust[studentId]
      setJustifications(newJust)
    }
  }

  const handleJustificationChange = (id: string, val: string) => {
    setJustifications((prev) => ({ ...prev, [id]: val }))
  }

  const handleSaveAttendance = async (data: z.infer<typeof formSchema>) => {
    if (!classId || !date) {
      sonnerToast.error('Selecione turma e data')
      return
    }

    const dateStr = format(data.date, 'yyyy-MM-dd')

    try {
      // Buscar ou criar aula para esta turma/disciplina/data
      let lessonId: number | null = null
      
      // Buscar aulas existentes
      const lessons = await lessonService.getByClass(parseInt(classId))
      const existingLesson = lessons.find((l) => {
        const lessonDate = l.lesson_date ? new Date(l.lesson_date).toISOString().split('T')[0] : null
        return lessonDate === dateStr && 
               (!subjectId || l.class_teacher_subject?.subject_id?.toString() === subjectId)
      })

      if (existingLesson) {
        lessonId = existingLesson.id
      } else {
        // Criar nova aula
        // TODO: Buscar class_teacher_subject_id baseado em classId e subjectId
        // Por enquanto, criar aula básica
        const newLesson = await lessonService.create({
          class_id: parseInt(classId),
          subject_id: subjectId ? parseInt(subjectId) : null,
          lesson_date: dateStr,
          start_time: '08:00:00',
          end_time: '09:00:00',
          class_teacher_subject_id: null, // TODO: Implementar busca de class_teacher_subject
        })
        lessonId = newLesson?.id || null
      }

      if (!lessonId) {
        sonnerToast.error('Não foi possível criar ou encontrar a aula')
        return
      }

      // Preparar registros de frequência
      const attendanceRecords = classStudents.map((student) => {
        const isPresent = selectedStudents.includes(student.id)
        const justification = !isPresent ? justifications[student.id] : undefined
        
        return {
          lesson_id: lessonId!,
          student_profile_id: student.studentProfileId,
          attendance_status: isPresent 
            ? 'Presente' as const
            : justification 
              ? 'Justificado' as const
              : 'Ausente' as const,
          notes: justification,
        }
      })

      // Registrar frequências em lote
      await recordAttendanceBatch(attendanceRecords)

      sonnerToast.success(`Frequência registrada para ${dateStr}`)
      
      // Recarregar frequências
      await fetchClassAttendance(parseInt(classId), { 
        date: dateStr,
        subjectId: subjectId ? parseInt(subjectId) : undefined
      })
    } catch (error: any) {
      sonnerToast.error(error?.message || 'Erro ao salvar frequência')
    }
  }

  const handleSaveOccurrence = () => {
    const data = form.getValues()
    if (!occurrenceStudentId || !occurrenceDesc || !activeYear) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha todos os campos da ocorrência',
      })
      return
    }

    addOccurrence({
      studentId: occurrenceStudentId,
      schoolId: data.schoolId,
      yearId: activeYear.id,
      classroomId: data.classId,
      date: data.date.toISOString(),
      type: occurrenceType as any,
      description: occurrenceDesc,
      recordedBy: 'Professor Logado', // Mocked
    })

    toast({
      title: 'Ocorrência Salva',
      description: 'Registro adicionado ao histórico do aluno.',
    })
    setOccurrenceDesc('')
    // Keep student selected to allow multiple entries or viewing history
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Check className="h-8 w-8" /> Diário de Classe Digital
        </h1>
        <p className="text-muted-foreground">
          Registro de frequência e ocorrências em tempo real.
        </p>
      </div>

      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Configuração da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="schoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(schools || []).map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!schoolId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classesLoading ? (
                          <div className="flex justify-center p-2">
                            <Clock className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          classes.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina (Opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!classId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Geral / Polivalente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSubjects.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Aula</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {classId && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance" className="gap-2">
              <Clock className="h-4 w-4" /> Frequência
            </TabsTrigger>
            <TabsTrigger value="occurrences" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Ocorrências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Chamada de Alunos</CardTitle>
                  <CardDescription>
                    Marque os alunos presentes ou registre justificativas.
                  </CardDescription>
                </div>
                <Button onClick={form.handleSubmit(handleSaveAttendance)}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Chamada
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead className="w-[100px] text-center">
                        Presença
                      </TableHead>
                      <TableHead>Justificativa (se falta)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStudents.map((student) => {
                      const isPresent = selectedStudents.includes(student.id)
                      return (
                        <TableRow
                          key={student.id}
                          className={!isPresent ? 'bg-red-50' : ''}
                        >
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className={cn(
                                'w-6 h-6 mx-auto rounded border cursor-pointer flex items-center justify-center transition-colors',
                                isPresent
                                  ? 'bg-green-500 border-green-600 text-white'
                                  : 'bg-white border-gray-300',
                              )}
                              onClick={() => togglePresence(student.id)}
                            >
                              {isPresent && <Check className="h-4 w-4" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              disabled={isPresent}
                              placeholder="Motivo da falta..."
                              value={justifications[student.id] || ''}
                              onChange={(e) =>
                                handleJustificationChange(
                                  student.id,
                                  e.target.value,
                                )
                              }
                              className="h-8"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="occurrences">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nova Ocorrência</CardTitle>
                  <CardDescription>
                    Registre comportamento, saúde ou observações pedagógicas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <FormLabel>Aluno</FormLabel>
                      <Select
                        value={occurrenceStudentId}
                        onValueChange={setOccurrenceStudentId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o aluno" />
                        </SelectTrigger>
                        <SelectContent>
                          {classStudents.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Tipo de Ocorrência</FormLabel>
                      <Select
                        value={occurrenceType}
                        onValueChange={setOccurrenceType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="behavior">
                            Comportamental
                          </SelectItem>
                          <SelectItem value="pedagogical">
                            Pedagógica
                          </SelectItem>
                          <SelectItem value="health">Saúde</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Descrição Detalhada</FormLabel>
                    <Textarea
                      value={occurrenceDesc}
                      onChange={(e) => setOccurrenceDesc(e.target.value)}
                      placeholder="Descreva o ocorrido..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={handleSaveOccurrence}
                      disabled={!occurrenceStudentId}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" /> Registrar
                      Ocorrência
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" /> Histórico de Ocorrências
                  </CardTitle>
                  <CardDescription>
                    Visualizando registros{' '}
                    {occurrenceStudentId
                      ? 'do aluno selecionado'
                      : 'de toda a turma'}
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {classOccurrences.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Registrado Por</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classOccurrences.map((occ) => {
                          const studentName =
                            classStudents.find((s) => s.id === occ.studentId)
                              ?.name || 'Desconhecido'
                          return (
                            <TableRow key={occ.id}>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(occ.date), 'dd/MM/yyyy HH:mm')}
                              </TableCell>
                              <TableCell>{studentName}</TableCell>
                              <TableCell className="capitalize">
                                {occ.type === 'behavior'
                                  ? 'Comportamental'
                                  : occ.type === 'pedagogical'
                                    ? 'Pedagógica'
                                    : occ.type === 'health'
                                      ? 'Saúde'
                                      : 'Outros'}
                              </TableCell>
                              <TableCell>{occ.description}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {occ.recordedBy}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma ocorrência encontrada.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
