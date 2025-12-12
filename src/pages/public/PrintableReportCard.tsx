import { ReportCardData } from './components/types'
import { cn } from '@/lib/utils'

interface PrintableReportCardProps {
  data: ReportCardData
  visibleColumns: string[]
}

export function PrintableReportCard({
  data,
  visibleColumns,
}: PrintableReportCardProps) {
  const isColumnVisible = (id: string) => visibleColumns.includes(id)

  const getGradeColorClass = (grade: number) => {
    // In print, usually black, but we can keep subtle bold/grayscale or dark colors
    if (grade < 5) return 'font-bold' // Rely on bold for print contrast
    return ''
  }

  const formatPeriodName = (name: string) => {
    return name.replace('Bimestre', 'Bim.')
  }

  return (
    <div className="hidden print:block w-full max-w-[210mm] mx-auto p-8 bg-white text-black">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center gap-4">
          {data.schoolLogo ? (
            <img
              src={data.schoolLogo}
              alt="Logo"
              className="h-16 w-16 object-contain"
            />
          ) : (
            <div className="h-16 w-16 bg-gray-200 flex items-center justify-center border border-gray-400">
              <span className="text-xs font-bold text-gray-500">LOGO</span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide">
              {data.school}
            </h1>
            <p className="text-sm text-gray-600">
              Sistema de Gestão Escolar Municipal
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold uppercase text-gray-800">
            Boletim Escolar
          </h2>
          <p className="text-sm">Ano Letivo: {data.year}</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="mb-6 p-4 border border-gray-300 rounded-sm bg-gray-50/50">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <span className="font-bold text-gray-700">Aluno:</span> {data.name}
          </div>
          <div>
            <span className="font-bold text-gray-700">Matrícula:</span>{' '}
            {data.registration}
          </div>
          <div>
            <span className="font-bold text-gray-700">Turma/Série:</span>{' '}
            {data.grade}
          </div>
          <div>
            <span className="font-bold text-gray-700">Regra de Avaliação:</span>{' '}
            {data.ruleName}
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase border-b border-gray-400 mb-2 pb-1">
          Desempenho Acadêmico
        </h3>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left w-1/3">
                Disciplina
              </th>
              {data.periodNames.map((p, idx) =>
                isColumnVisible(`period_${idx}`) ? (
                  <th
                    key={p}
                    className="border border-gray-300 p-2 text-center"
                  >
                    {formatPeriodName(p)}
                  </th>
                ) : null,
              )}
              {isColumnVisible('final') && (
                <th className="border border-gray-300 p-2 text-center font-bold bg-gray-200">
                  Média Final
                </th>
              )}
              {isColumnVisible('status') && (
                <th className="border border-gray-300 p-2 text-center">
                  Situação
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.grades.map((grade) => (
              <tr key={grade.subject}>
                <td className="border border-gray-300 p-2 font-medium">
                  {grade.subject}
                </td>
                {grade.periodGrades.map((p, idx) =>
                  isColumnVisible(`period_${idx}`) ? (
                    <td
                      key={idx}
                      className="border border-gray-300 p-2 text-center"
                    >
                      <span className={cn(getGradeColorClass(p))}>
                        {p.toFixed(1)}
                      </span>
                    </td>
                  ) : null,
                )}
                {isColumnVisible('final') && (
                  <td className="border border-gray-300 p-2 text-center font-bold bg-gray-50">
                    <span className={cn(getGradeColorClass(grade.final))}>
                      {grade.final.toFixed(1)}
                    </span>
                  </td>
                )}
                {isColumnVisible('status') && (
                  <td className="border border-gray-300 p-2 text-center text-xs uppercase">
                    {grade.status}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dependencies if any */}
      {data.dependencies.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase border-b border-gray-400 mb-2 pb-1 text-gray-700">
            Dependências
          </h3>
          {data.dependencies.map((dep, idx) => (
            <div key={idx} className="mb-4">
              <p className="text-xs font-bold mb-1">Turma: {dep.className}</p>
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left w-1/3">
                      Disciplina
                    </th>
                    {isColumnVisible('final') && (
                      <th className="border border-gray-300 p-2 text-center">
                        Média Final
                      </th>
                    )}
                    {isColumnVisible('status') && (
                      <th className="border border-gray-300 p-2 text-center">
                        Situação
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {dep.grades.map((grade) => (
                    <tr key={grade.subject}>
                      <td className="border border-gray-300 p-2 font-medium">
                        {grade.subject}
                      </td>
                      {isColumnVisible('final') && (
                        <td className="border border-gray-300 p-2 text-center font-bold">
                          {grade.final.toFixed(1)}
                        </td>
                      )}
                      {isColumnVisible('status') && (
                        <td className="border border-gray-300 p-2 text-center text-xs uppercase">
                          {grade.status}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Signatures */}
      <div className="mt-16 grid grid-cols-3 gap-8 text-center text-xs">
        <div className="border-t border-black pt-2">
          <p className="font-bold">Secretaria Escolar</p>
        </div>
        <div className="border-t border-black pt-2">
          <p className="font-bold">Direção</p>
        </div>
        <div className="border-t border-black pt-2">
          <p className="font-bold">Responsável Legal</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between">
        <span>Documento gerado eletronicamente.</span>
        <span>{data.generatedAt}</span>
      </div>
    </div>
  )
}
