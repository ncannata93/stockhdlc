import { getTodayReport } from "./queries"
import { DailyReport } from "./daily-report"

export const dynamic = "force-dynamic"

export default async function LimpiezaPage() {
  const report = await getTodayReport()

  return (
    <div className="container mx-auto py-6">
      <DailyReport report={report} />
    </div>
  )
}
