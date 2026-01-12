import { postponeSheetChange } from "@/app/limpieza/actions"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    await postponeSheetChange(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in postpone-sheets route:", error)
    return NextResponse.json({ error: "Failed to postpone sheets" }, { status: 500 })
  }
}
