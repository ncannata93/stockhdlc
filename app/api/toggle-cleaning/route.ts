import { toggleCleaningComplete } from "@/app/limpieza/actions"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { id, isCompleted, mergedIds } = await request.json()

    await toggleCleaningComplete(id, isCompleted, mergedIds)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling cleaning:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
