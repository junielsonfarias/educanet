import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, MapPin, Bus, Users, HeartPulse } from 'lucide-react'
import { Student } from '@/lib/mock-data'

interface StudentInfoCardProps {
  student: Student
}

export function StudentInfoCard({ student }: StudentInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Pessoais Detalhados</CardTitle>
        <CardDescription>Informações cadastrais e sociais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">CPF</span>
            <p className="font-medium">{student.cpf || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Cartão SUS</span>
            <p className="font-medium">{student.susCard || '-'}</p>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Certidão de Nascimento
            </span>
            <p className="font-medium">{student.birthCertificate || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">NIS</span>
            <p className="font-medium">{student.social?.nis || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Raça/Cor</span>
            <p className="font-medium">{student.raceColor || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Nome do Pai</span>
            <p className="font-medium">{student.fatherName || '-'}</p>
            <span className="text-xs text-muted-foreground block mt-0.5">
              {student.fatherEducation || 'Escolaridade não inf.'}
            </span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Nome da Mãe</span>
            <p className="font-medium">{student.motherName || '-'}</p>
            <span className="text-xs text-muted-foreground block mt-0.5">
              {student.motherEducation || 'Escolaridade não inf.'}
            </span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Nacionalidade</span>
            <p className="font-medium">
              {student.nationality} - {student.birthCountry}
            </p>
          </div>
        </div>
        <Separator />
        <div>
          <span className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4" /> Endereço
          </span>
          {student.address ? (
            <>
              <p className="font-medium">
                {student.address?.street}, {student.address?.number} -{' '}
                {student.address?.neighborhood}
              </p>
              <p className="text-sm text-muted-foreground">
                {student.address?.city}/{student.address?.state} - CEP:{' '}
                {student.address?.zipCode}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground italic">
              Endereço não cadastrado
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              <Bus className="h-3 w-3" /> Transporte
            </span>
            <Badge
              variant={student.transport?.uses ? 'default' : 'outline'}
              className="w-fit"
            >
              {student.transport?.uses
                ? `Sim (${student.transport.routeNumber})`
                : 'Não'}
            </Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              <Users className="h-3 w-3" /> Bolsa Família
            </span>
            <Badge
              variant={student.social?.bolsaFamilia ? 'default' : 'outline'}
              className="w-fit"
            >
              {student.social?.bolsaFamilia ? 'Beneficiário' : 'Não'}
            </Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              <HeartPulse className="h-3 w-3" /> Nec. Especiais
            </span>
            {student.health?.hasSpecialNeeds ? (
              <div className="flex flex-col">
                <Badge variant="destructive" className="w-fit mb-1">
                  Sim
                </Badge>
                <span className="text-xs">{student.health.cid}</span>
              </div>
            ) : (
              <Badge variant="outline" className="w-fit">
                Não
              </Badge>
            )}
          </div>
        </div>
        {student.health?.observation && (
          <div className="bg-muted/30 p-3 rounded-md text-sm mt-2">
            <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">
              Observações de Saúde
            </span>
            {student.health.observation}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
