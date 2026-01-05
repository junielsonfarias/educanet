import { useState, useMemo } from 'react'
import {
  Search,
  MapPin,
  School as SchoolIcon,
  LayoutGrid,
  List,
  Map as MapIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SchoolMap } from './components/SchoolMap'

export default function PublicSchools() {
  const { schools } = useSchoolStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [poloFilter, setPoloFilter] = useState('all')

  // Extract unique polos
  const polos = useMemo(() => {
    const p = new Set(schools.map((s) => s.polo).filter(Boolean))
    return Array.from(p) as string[]
  }, [schools])

  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesZone = zoneFilter === 'all' || s.locationType === zoneFilter
    const matchesPolo = poloFilter === 'all' || s.polo === poloFilter
    return matchesSearch && matchesZone && matchesPolo
  })

  // Group by Polo for grouped view
  const schoolsByPolo = useMemo(() => {
    const groups: Record<string, typeof schools> = {}
    filteredSchools.forEach((s) => {
      const key = s.polo || 'Sem Polo Definido'
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    })
    return groups
  }, [filteredSchools])

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4 flex items-center justify-center gap-3">
          <SchoolIcon className="h-10 w-10" />
          Nossas Escolas
        </h1>
        <p className="text-xl text-muted-foreground">
          Encontre a unidade escolar mais próxima de você.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar escola por nome ou endereço..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Zona (Rural/Urbana)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Zonas</SelectItem>
                <SelectItem value="Urbana">Zona Urbana</SelectItem>
                <SelectItem value="Rural">Zona Rural</SelectItem>
              </SelectContent>
            </Select>
            <Select value={poloFilter} onValueChange={setPoloFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Polo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Polos</SelectItem>
                {polos.map((polo) => (
                  <SelectItem key={polo} value={polo}>
                    {polo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <p className="text-muted-foreground text-sm">
            {filteredSchools.length} escolas encontradas
          </p>
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" /> Lista
            </TabsTrigger>
            <TabsTrigger value="grouped">
              <LayoutGrid className="h-4 w-4 mr-2" /> Por Polo
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="h-4 w-4 mr-2" /> Mapa
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grouped">
          <div className="space-y-8">
            {Object.entries(schoolsByPolo).map(([poloName, groupSchools]) => (
              <div key={poloName}>
                <h3 className="text-2xl font-bold mb-4 pl-2 border-l-4 border-primary text-primary/80">
                  {poloName}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupSchools.map((school) => (
                    <SchoolCard key={school.id} school={school} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map">
          <SchoolMap schools={filteredSchools} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SchoolCard({ school }: { school: any }) {
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{school.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {school.address}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end gap-2">
        <div className="flex flex-wrap gap-2">
          {school.locationType && (
            <Badge variant="outline">{school.locationType}</Badge>
          )}
          {school.polo && <Badge variant="secondary">{school.polo}</Badge>}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          <p>
            <strong>Direção:</strong> {school.director}
          </p>
          <p>
            <strong>Telefone:</strong> {school.phone}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
