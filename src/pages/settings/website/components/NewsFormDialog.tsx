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
import { NewsPost } from '@/lib/mock-data'

const newsSchema = z.object({
  title: z.string().min(5, 'O título deve ter no mínimo 5 caracteres'),
  summary: z.string().min(10, 'O resumo deve ter no mínimo 10 caracteres'),
  content: z.string().min(20, 'O conteúdo deve ter no mínimo 20 caracteres'),
  author: z.string().min(2, 'Autor obrigatório'),
  imageUrl: z.string().optional(),
  publishDate: z.string().min(1, 'Data de publicação obrigatória'),
})

interface NewsFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: NewsPost | null
}

export function NewsFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: NewsFormDialogProps) {
  const form = useForm<z.infer<typeof newsSchema>>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      summary: '',
      content: '',
      author: '',
      imageUrl: '',
      publishDate: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          title: initialData.title,
          summary: initialData.summary,
          content: initialData.content,
          author: initialData.author,
          imageUrl: initialData.imageUrl || '',
          publishDate: initialData.publishDate.split('T')[0],
        })
      } else {
        form.reset({
          title: '',
          summary: '',
          content: '',
          author: '',
          imageUrl: '',
          publishDate: new Date().toISOString().split('T')[0],
        })
      }
    }
  }, [open, initialData, form])

  const handleSubmit = (data: z.infer<typeof newsSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Notícia' : 'Nova Notícia'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da notícia para publicação no site.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da notícia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autor/Fonte</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ascom" {...field} />
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
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem (Capa)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
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
                  <FormLabel>Resumo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição que aparecerá na listagem..."
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo Completo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Texto completo da notícia..."
                      className="min-h-[200px]"
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
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
