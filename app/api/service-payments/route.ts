import { type NextRequest, NextResponse } from "next/server"
import { getServicePayments, addServicePayment, updateServicePayment, deleteServicePayment } from "@/lib/service-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get("hotel_id")
    const serviceId = searchParams.get("service_id")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const status = searchParams.get("status")

    const filters: any = {}
    if (month) filters.month = Number.parseInt(month)
    if (year) filters.year = Number.parseInt(year)
    if (status) filters.status = status

    let payments = await getServicePayments(hotelId || undefined, filters)

    // Filtrar por service_id si se proporciona
    if (serviceId) {
      payments = payments.filter((payment) => payment.service_id === serviceId)
    }

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching service payments:", error)
    return NextResponse.json({ error: "Failed to fetch service payments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payment = await addServicePayment(body)
    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error creating service payment:", error)
    return NextResponse.json({ error: "Failed to create service payment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    await updateServicePayment(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating service payment:", error)
    return NextResponse.json({ error: "Failed to update service payment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    await deleteServicePayment(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting service payment:", error)
    return NextResponse.json({ error: "Failed to delete service payment" }, { status: 500 })
  }
}
