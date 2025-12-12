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
import { useToast } from '@/hooks/use-toast'
import useSchoolStore from '@/stores/useSchoolStore'
import useStudentStore from '@/stores/useStudentStore'
import useAttendanceStore from '@/stores/useAttendanceStore'
import useOccurrenceStore from '@/stores/useOccurrenceStore'
import useCourseStore from '@/stores/useCourseStore'

const formSchema = z.object({
  schoolId: z.string().min(1, 'Escola é obrigatória'),
  classId: z.string().min(1, 'Turma é obrigatória'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  subjectId: z.string().optional(),
})

export default function DigitalClassDiary() {
  const { schools } = useSchoolStore()
  const { students } = useStudentStore()
  const { addAttendance, getClassAttendance } = useAttendanceStore()
  const { addOccurrence, getClassOccurrences } = useOccurrenceStore()
  const { courses } = useCourseStore()
  const { toast } = useToast()

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

  // Derived Data
  const selectedSchool = schools.find((s) => s.id === schoolId)
  // Find year that is active
  const activeYear = selectedSchool?.academicYears.find(
    (y) => y.status === 'active',
  )
  const classes = activeYear?.classes || []
  const selectedClass = classes.find((c) => c.id === classId)

  // Find subjects for class
  const classGrade = courses
    .flatMap((c) => c.grades)
    .find((g) => g.id === selectedClass?.gradeId)
  const subjects = classGrade?.subjects || []

  const classStudents = useMemo(() => {
    if (!selectedClass || !selectedSchool) return []
    return students
      .filter((s) => {
        const enrollment = s.enrollments.find((e) => e.status === 'Cursando')
        return (
          enrollment &&
          enrollment.schoolId === selectedSchool.id &&
          enrollment.grade === selectedClass.name
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [students, selectedClass, selectedSchool])

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
    if (!classId || !date) return

    const dateStr = format(date, 'yyyy-MM-dd')
    const existingRecords = getClassAttendance(
      classId,
      subjectId || 'general',
      dateStr,
    )

    if (existingRecords && existingRecords.length > 0) {
      // Load existing state
      const presentIds = existingRecords
        .filter((r) => r.present)
        .map((r) => r.studentId)
      const justificationMap: Record<string, string> = {}
      existingRecords.forEach((r) => {
        if (!r.present && r.justification) {
          justificationMap[r.studentId] = r.justification
        }
      })

      setSelectedStudents(presentIds)
      setJustifications(justificationMap)
      toast({
        title: 'Dados Carregados',
        description: `Frequência de ${dateStr} carregada.`,
      })
    } else {
      // Default: All present if loaded fresh
      if (classStudents.length > 0) {
        setSelectedStudents(classStudents.map((s) => s.id))
        setJustifications({})
      }
    }
  }, [classId, date, subjectId, getClassAttendance, classStudents, toast])

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

  const handleSaveAttendance = (data: z.infer<typeof formSchema>) => {
    if (!activeYear) return

    const dateStr = format(data.date, 'yyyy-MM-dd')

    // In a real app, we should probably update existing records instead of just adding
    // but the store `addAttendance` currently just appends.
    // For this mock implementation, we'll append, but the `useEffect` above reads the matching records.
    // Ideally the store should handle upsert.

    classStudents.forEach((student) => {
      const isPresent = selectedStudents.includes(student.id)
      addAttendance({
        studentId: student.id,
        schoolId: data.schoolId,
        yearId: activeYear.id,
        classroomId: data.classId,
        subjectId: data.subjectId || 'general',
        date: dateStr, // Use date string YYYY-MM-DD
        present: isPresent,
        justification: !isPresent ? justifications[student.id] : undefined,
      })
    })

    toast({
      title: 'Frequência Registrada',
      description: `Presença salva para ${dateStr}`,
    })
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
                        {schools.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
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
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
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
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
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
