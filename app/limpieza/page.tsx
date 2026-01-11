"use client"

import { getTodayReport } from "./actions"
import { Calendar } from "lucide-react"
import { DailyReport } from "./daily-report"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function LimpiezaPage() {
  const report = await getTodayReport()

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 2cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8 print:bg-white print:p-0">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reporte de Limpieza</h1>
                <p className="text-muted-foreground">Vista diaria para el personal</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/limpieza/admin">Administrar Estadías</Link>
            </Button>
          </div>

          <DailyReport report={report} />
        </div>
      </div>
    </>
  )
}
