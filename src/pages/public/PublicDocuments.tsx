import { useState } from 'react'
import {
  FileText,
  Search,
  Filter,
  Download,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import usePublicContentStore from '@/stores/usePublicContentStore'
import { format, parseISO } from 'date-fns'

export default function PublicDocuments() {
  const { documents } = usePublicContentStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [organFilter, setOrganFilter] = useState('all')

  const activeDocuments = documents.filter((d) => d.active)

  // Unique filters
  const uniqueYears = Array.from(
    new Set(activeDocuments.map((d) => d.year)),
  ).sort((a, b) => b.localeCompare(a))
  const uniqueOrgans = Array.from(
    new Set(activeDocuments.map((d) => d.organ)),
  ).sort()

  const filteredDocuments = activeDocuments.filter((doc) => {
    const matchesSearch =
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.theme.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesYear = yearFilter === 'all' || doc.year === yearFilter
    const matchesOrgan = organFilter === 'all' || doc.organ === organFilter

    return matchesSearch && matchesYear && matchesOrgan
  })

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Documentos Públicos
        </h1>
        <p className="text-muted-foreground text-lg">
          Transparência: Consulte decretos, portarias e comunicados oficiais.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrar Documentos</CardTitle>
          <CardDescription>
            Utilize os filtros para localizar o documento desejado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, ementa ou tema..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Ano" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={organFilter} onValueChange={setOrganFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Órgão" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Órgãos</SelectItem>
                {uniqueOrgans.map((organ) => (
                  <SelectItem key={organ} value={organ}>
                    {organ}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Nº Documento</TableHead>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Ementa / Assunto</TableHead>
                <TableHead className="w-[150px]">Órgão</TableHead>
                <TableHead className="w-[100px] text-right">Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum documento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="group hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {doc.documentNumber}
                      <span className="block text-xs text-muted-foreground md:hidden">
                        {format(parseISO(doc.publishDate), 'dd/MM/yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(parseISO(doc.publishDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm md:text-base">
                          {doc.theme}
                        </span>
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {doc.summary}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{doc.organ}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        asChild
                      >
                        <a
                          href={doc.driveLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Abrir</span>
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
