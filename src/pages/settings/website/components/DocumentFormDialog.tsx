import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PublicDocument } from '@/lib/mock-data'

const docSchema = z.object({
  organ: z.string().min(2, 'Órgão é obrigatório'),
  documentNumber: z.string().min(2, 'Número é obrigatório'),
  year: z.string().min(4, 'Ano inválido'),
  publishDate: z.string().min(1, 'Data obrigatória'),
  summary: z.string().min(5, 'Ementa obrigatória'),
  theme: z.string().min(3, 'Tema obrigatório'),
  driveLink: z.string().url('Link inválido (deve ser uma URL)'),
})

interface DocumentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: PublicDocument | null
}

export function DocumentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: DocumentFormDialogProps) {
  const form = useForm<z.infer<typeof docSchema>>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      organ: '',
      documentNumber: '',
      year: new Date().getFullYear().toString(),
      publishDate: new Date().toISOString().split('T')[0],
      summary: '',
      theme: '',
      driveLink: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          organ: initialData.organ,
          documentNumber: initialData.documentNumber,
          year: initialData.year,
          publishDate: initialData.publishDate.split('T')[0],
          summary: initialData.summary,
          theme: initialData.theme,
          driveLink: initialData.driveLink,
        })
      } else {
        form.reset({
          organ: '',
          documentNumber: '',
          year: new Date().getFullYear().toString(),
          publishDate: new Date().toISOString().split('T')[0],
          summary: '',
          theme: '',
          driveLink: '',
        })
      }
    }
  }, [open, initialData, form])

  const handleSubmit = (data: z.infer<typeof docSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Documento' : 'Publicar Documento'}
          </DialogTitle>
          <DialogDescription>
            Insira os dados do documento oficial para o portal da transparência.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº do Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Dec. 123/2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organ"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Órgão Emissor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SEMED" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="publishDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Publicação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema/Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Calendário Escolar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ementa (Resumo)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição breve do conteúdo do documento..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="driveLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do Google Drive (PDF)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://drive.google.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Publicar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
