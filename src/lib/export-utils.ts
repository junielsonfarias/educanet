import { format } from 'date-fns'

/**
 * Converts an array of objects to a CSV string and triggers download.
 */
export const exportToCSV = (
  data: any[],
  filename: string,
  columns?: string[],
) => {
  if (!data || data.length === 0) return

  // Determine headers
  const headers = columns || Object.keys(data[0])

  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          const val = row[fieldName] !== undefined ? row[fieldName] : ''
          const escaped = JSON.stringify(val) // Handle quotes and commas
          return escaped
        })
        .join(','),
    ),
  ]

  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })

  triggerDownload(blob, `${filename}.csv`)
}

/**
 * Generates an HTML Table based file which Excel can open (Pseudo-Excel).
 * True XLSX requires heavy libraries not present in the stack.
 */
export const exportToExcel = (
  data: any[],
  filename: string,
  columns?: string[],
) => {
  if (!data || data.length === 0) return

  const headers = columns || Object.keys(data[0])

  let html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">'
  html +=
    '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>'
  html += '<body><table>'

  // Header
  html += '<tr>'
  headers.forEach((h) => {
    html += `<th style="background-color: #f0f0f0; border: 1px solid #ddd; padding: 8px;">${h}</th>`
  })
  html += '</tr>'

  // Body
  data.forEach((row) => {
    html += '<tr>'
    headers.forEach((h) => {
      const val = row[h] !== undefined && row[h] !== null ? row[h] : ''
      html += `<td style="border: 1px solid #ddd; padding: 8px;">${val}</td>`
    })
    html += '</tr>'
  })

  html += '</table></body></html>'

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  triggerDownload(blob, `${filename}.xls`)
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const triggerPrint = () => {
  window.print()
}
