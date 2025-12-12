import * as React from 'react'
import {
  Calendar,
  CreditCard,
  Settings,
  User,
  School,
  GraduationCap,
  BookOpen,
} from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useNavigate } from 'react-router-dom'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useTeacherStore from '@/stores/useTeacherStore'
import useLessonPlanStore from '@/stores/useLessonPlanStore'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { teachers } = useTeacherStore()
  const { lessonPlans } = useLessonPlanStore()

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      onOpenChange(false)
      command()
    },
    [onOpenChange],
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Digite para buscar..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Ações Rápidas">
          <CommandItem
            onSelect={() => runCommand(() => navigate('/dashboard'))}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => navigate('/dashboard/estrategico'))
            }
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>Painel Estratégico</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/configuracoes'))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Alunos">
          {students.slice(0, 5).map((student) => (
            <CommandItem
              key={student.id}
              onSelect={() =>
                runCommand(() => navigate(`/pessoas/alunos/${student.id}`))
              }
            >
              <User className="mr-2 h-4 w-4" />
              <span>{student.name}</span>
              <CommandShortcut>Aluno</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Escolas">
          {schools.slice(0, 5).map((school) => (
            <CommandItem
              key={school.id}
              onSelect={() =>
                runCommand(() => navigate(`/escolas/${school.id}`))
              }
            >
              <School className="mr-2 h-4 w-4" />
              <span>{school.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Professores">
          {teachers.slice(0, 5).map((teacher) => (
            <CommandItem
              key={teacher.id}
              onSelect={() =>
                runCommand(() => navigate(`/pessoas/professores/${teacher.id}`))
              }
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              <span>{teacher.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Planos de Aula">
          {lessonPlans.slice(0, 5).map((plan) => (
            <CommandItem
              key={plan.id}
              onSelect={() =>
                runCommand(() => navigate('/academico/planejamento'))
              }
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>{plan.topic}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
