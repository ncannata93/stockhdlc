import { getActiveAndPastBookings, getCleaningSchedule } from "../queries"
import { Sparkles } from "lucide-react"
import { ClientWrapper } from "../client-wrapper"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminPage() {
  const bookings = await getActiveAndPastBookings()
  const schedule = await getCleaningSchedule()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Administración de Estadías</h1>
              <p className="text-muted-foreground">Gestionar reservas y cronograma de limpieza</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/limpieza">Ver Reporte del Día</Link>
          </Button>
        </div>

        <ClientWrapper bookings={bookings} schedule={schedule} />
      </div>
    </div>
  )
}
