"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Calendar } from "lucide-react"
import type { CleaningSchedule } from "./actions"
import { toggleCleaningComplete } from "./actions"
import { useState, useMemo } from "react"
import { getApartmentType } from "./apartment-types"

type Props = {
  report: (CleaningSchedule & { booking_notes?: string | null; _mergedIds?: string[] })[]
}

const ALL_APARTMENTS = [
  ...Array.from({ length: 19 }, (_, i) => {
    const num = 101 + i
    return num === 113 ? null : num.toString()
  }).filter(Boolean),
  ...Array.from({ length: 17 }, (_, i) => {
    const num = 201 + i
    return num === 213 ? null : num.toString()
  }).filter(Boolean),
] as string[]

export function DailyReport({ report }: Props) {
  const [localReport, setLocalReport] = useState(report)
  const today = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const formattedDate = today.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })

  const handlePrint = () => {
    window.print()
  }

  const handleToggleComplete = async (id: string, currentStatus: boolean, mergedIds?: string[]) => {
    try {
      await toggleCleaningComplete(id, !currentStatus, mergedIds)
      setLocalReport((prev) => prev.map((item) => (item.id === id ? { ...item, is_completed: !currentStatus } : item)))
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const apartmentMap = useMemo(() => {
    const map = new Map<string, (CleaningSchedule & { booking_notes?: string | null; _mergedIds?: string[] }) | null>()

    ALL_APARTMENTS.forEach((apt) => {
      const cleaning = localReport.find((r) => r.apartment === apt)
      map.set(apt, cleaning || null)
    })

    return map
  }, [localReport])

  const firstFloor = ALL_APARTMENTS.filter((apt) => apt.startsWith("1"))
  const secondFloor = ALL_APARTMENTS.filter((apt) => apt.startsWith("2"))

  const stats = {
    total: localReport.length,
    completed: localReport.filter((r) => r.is_completed).length,
    pending: localReport.filter((r) => !r.is_completed).length,
    totalPax: Array.from(apartmentMap.values())
      .filter((cleaning) => cleaning !== null)
      .reduce((sum, cleaning) => sum + (cleaning!.pax || 0), 0),
  }

  const renderApartmentRow = (apt: string) => {
    const cleaning = apartmentMap.get(apt)
    const apartmentType = getApartmentType(apt)

    if (!cleaning) {
      return (
        <tr key={apt} className="border-b border-gray-300">
          <td className="py-2 px-3 font-bold text-center">
            {apt}
            {apartmentType && <span className="text-xs font-normal block text-gray-600">{apartmentType}</span>}
          </td>
          <td className="py-2 px-3 text-center text-gray-400">-</td>
          <td className="py-2 px-3 text-center text-gray-400">-</td>
          <td className="py-2 px-3 text-center text-gray-400">-</td>
          <td className="py-2 px-3 text-center text-gray-400 text-xs">-</td>
          <td className="py-2 px-3 text-center">
            <div className="w-5 h-5 border-2 border-gray-300 mx-auto print:border-black" />
          </td>
        </tr>
      )
    }

    let borderColor = ""

    if (cleaning.day_type === "check-in") {
      borderColor = "border-l-4 border-l-green-500 print:border-l-black"
    } else if (cleaning.day_type === "check-out") {
      borderColor = "border-l-4 border-l-red-500 print:border-l-black"
    } else if (cleaning.day_type === "check-in-out") {
      borderColor = "border-l-4 border-l-blue-500 print:border-l-black"
    }

    // Determinar tipo de limpieza
    let cleaningLabel = ""
    let cleaningBg = ""

    if (cleaning.day_type === "check-in" || cleaning.day_type === "check-out" || cleaning.day_type === "check-in-out") {
      cleaningLabel = "Completa"
      cleaningBg = "bg-red-100 print:bg-gray-200"
    } else if (cleaning.cleaning_type === "repaso-sabanas") {
      cleaningLabel = "Rep + Sáb"
      cleaningBg = "bg-blue-100 print:bg-gray-100"
    } else {
      cleaningLabel = "Repaso"
      cleaningBg = "bg-gray-100"
    }

    let dayType = ""

    if (cleaning.day_type === "check-in") {
      dayType = "IN"
    } else if (cleaning.day_type === "check-out") {
      dayType = "OUT"
    } else if (cleaning.day_type === "check-in-out") {
      dayType = "IN/OUT"
    }

    return (
      <tr key={cleaning.id} className={`border-b border-gray-300 ${cleaningBg} ${borderColor}`}>
        <td className="py-2 px-3 font-bold text-center">
          {apt}
          {apartmentType && (
            <span className="text-xs font-normal block text-gray-600 print:text-black">{apartmentType}</span>
          )}
        </td>
        <td className="py-2 px-3 text-center text-sm font-medium">{dayType || "-"}</td>
        <td className="py-2 px-3 text-center text-sm font-medium">{cleaningLabel}</td>
        <td className="py-2 px-3 text-center text-sm font-semibold">{cleaning.pax ? `${cleaning.pax} PAX` : "-"}</td>
        <td
          className="py-2 px-3 text-center text-xs max-w-[120px] truncate print:max-w-none print:truncate-none print:whitespace-normal print:text-left print:break-words"
          title={cleaning.notes || cleaning.booking_notes || undefined}
        >
          {cleaning.notes || cleaning.booking_notes || "-"}
        </td>
        <td className="py-2 px-3 text-center">
          <input
            type="checkbox"
            checked={cleaning.is_completed}
            onChange={() => handleToggleComplete(cleaning.id, cleaning.is_completed, cleaning._mergedIds)}
            className="w-5 h-5 cursor-pointer print:appearance-none print:border-2 print:border-black"
          />
        </td>
      </tr>
    )
  }

  const PrintHeader = () => (
    <div className="hidden print:block mb-4 print-header">
      <div className="text-center border-b-2 border-black pb-2">
        <h1 className="text-2xl font-bold mb-1">REPORTE DE LIMPIEZA</h1>
        <p className="text-base capitalize print-date">{formattedDate}</p>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-2 print-stats">
        <div className="p-1 text-center border border-black">
          <div className="text-base font-bold">{stats.total}</div>
          <div className="text-[8px]">Total</div>
        </div>
        <div className="p-1 text-center border border-black">
          <div className="text-base font-bold">{stats.completed}</div>
          <div className="text-[8px]">Completas</div>
        </div>
        <div className="p-1 text-center border border-black">
          <div className="text-base font-bold">{stats.pending}</div>
          <div className="text-[8px]">Pendientes</div>
        </div>
        <div className="p-1 text-center border border-black">
          <div className="text-base font-bold">{stats.totalPax}</div>
          <div className="text-[8px]">Total PAX</div>
        </div>
      </div>
    </div>
  )

  const PrintFooter = () => (
    <div className="hidden print:block mt-6 pt-3 border-t-2 border-black print-footer">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="font-bold text-sm mb-2">Supervisor:</p>
          <div className="border-b-2 border-black w-full h-4" />
        </div>
        <div>
          <p className="font-bold text-sm mb-2">Firma:</p>
          <div className="border-b-2 border-black w-full h-4" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header con botón de imprimir */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Reporte del Día</h2>
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          </div>
        </div>
        <Button onClick={handlePrint} size="lg" className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          #print-content,
          #print-content * {
            visibility: visible;
          }
          
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Ocultar URL y headers/footers del navegador en impresión */
          @page {
            margin: 10mm 12mm;
          }
          
          /* Ocultar elementos del header y footer del navegador */
          body::before,
          body::after {
            display: none !important;
          }
          
          /* Agregado page-break-after al primer piso para separar en hojas diferentes */
          .first-floor-section {
            page-break-after: always;
          }
          
          table {
            font-size: 9px !important;
            page-break-inside: avoid;
            table-layout: fixed !important;
            width: 100% !important;
          }
          
          /* Ajustados anchos de columnas para más espacio en cada tabla */
          table th:nth-child(1), table td:nth-child(1) { width: 14% !important; }
          table th:nth-child(2), table td:nth-child(2) { width: 12% !important; }
          table th:nth-child(3), table td:nth-child(3) { width: 16% !important; }
          table th:nth-child(4), table td:nth-child(4) { width: 11% !important; }
          table th:nth-child(5), table td:nth-child(5) { width: 38% !important; }
          table th:nth-child(6), table td:nth-child(6) { width: 9% !important; }
          
          th, td {
            padding: 3px 2px !important;
          }
          
          .print-header {
            font-size: 14px !important;
            margin-bottom: 6px !important;
          }
          
          .print-date {
            font-size: 10px !important;
          }
          
          .print-stats {
            font-size: 8px !important;
            margin-bottom: 6px !important;
            gap: 6px !important;
          }
          
          .print-legend {
            font-size: 7px !important;
            margin-top: 4px !important;
          }
          
          .print-footer {
            font-size: 8px !important;
            margin-top: 8px !important;
          }
          
          h3 {
            font-size: 11px !important;
            margin-bottom: 3px !important;
          }
        }
      `}</style>

      <div id="print-content">
        {/* Estadísticas compactas - Solo visible en pantalla */}
        <div className="grid grid-cols-4 gap-4 mb-4 print:hidden">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completas</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pendientes</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalPax}</div>
            <div className="text-xs text-muted-foreground">Total PAX</div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4 print:gap-2 print-two-columns">
          {/* Primer Piso - Con su propio header y footer */}
          <div className="first-floor-section">
            <PrintHeader />

            <h3 className="text-lg font-bold mb-2 print:mb-1 print:text-base">Primer Piso (101-119)</h3>
            <div className="border-2 border-gray-300 print:border-black rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-200 print:bg-gray-300">
                  <tr className="border-b-2 border-gray-300 print:border-black">
                    <th className="py-2 px-3 text-sm font-bold">Apart.</th>
                    <th className="py-2 px-3 text-sm font-bold">Tipo</th>
                    <th className="py-2 px-3 text-sm font-bold">Limpieza</th>
                    <th className="py-2 px-3 text-sm font-bold">PAX</th>
                    <th className="py-2 px-3 text-sm font-bold">Notas</th>
                    <th className="py-2 px-3 text-sm font-bold">✓</th>
                  </tr>
                </thead>
                <tbody className="text-sm">{firstFloor.map((apt) => renderApartmentRow(apt))}</tbody>
              </table>
            </div>

            <PrintFooter />
          </div>

          {/* Segundo Piso - Con su propio header y footer */}
          <div>
            <PrintHeader />

            <h3 className="text-lg font-bold mb-2 print:mb-1 print:text-base">Segundo Piso (201-217)</h3>
            <div className="border-2 border-gray-300 print:border-black rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-200 print:bg-gray-300">
                  <tr className="border-b-2 border-gray-300 print:border-black">
                    <th className="py-2 px-3 text-sm font-bold">Apart.</th>
                    <th className="py-2 px-3 text-sm font-bold">Tipo</th>
                    <th className="py-2 px-3 text-sm font-bold">Limpieza</th>
                    <th className="py-2 px-3 text-sm font-bold">PAX</th>
                    <th className="py-2 px-3 text-sm font-bold">Notas</th>
                    <th className="py-2 px-3 text-sm font-bold">✓</th>
                  </tr>
                </thead>
                <tbody className="text-sm">{secondFloor.map((apt) => renderApartmentRow(apt))}</tbody>
              </table>
            </div>

            <PrintFooter />
          </div>
        </div>

        <Card className="p-3 print:shadow-none print:border print:border-black print:mt-2 print:p-2 print-legend">
          <div className="flex flex-wrap gap-4 text-xs print:gap-2 print:text-[8px]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 print:bg-gray-200 border border-gray-300 print:w-3 print:h-3" />
              <span className="font-medium">Limpieza Completa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 print:bg-gray-100 border border-gray-300 print:w-3 print:h-3" />
              <span className="font-medium">Repaso + Sábanas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 print:w-3 print:h-3" />
              <span className="font-medium">Repaso Diario</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-l-green-500 print:border-l-black border border-gray-300 print:w-3 print:h-3" />
              <span className="font-medium">IN (Check-In)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-l-red-500 print:border-l-black border border-gray-300 print:w-3 print:h-3" />
              <span className="font-medium">OUT (Check-Out)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-l-blue-500 print:border-l-black border border-gray-300 print:w-3 print:h-3" />
              <span className="font-medium">IN/OUT</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
