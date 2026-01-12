import { type NextRequest, NextResponse } from "next/server"
import { getServicePayments, addServicePayment, updateServicePayment, deleteServicePayment } from "@/lib/service-db"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 API: Obteniendo pagos de servicios...")

    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get("hotel_id")
    const serviceId = searchParams.get("service_id")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const status = searchParams.get("status")

    console.log("🔍 API: Parámetros recibidos:", {
      hotelId,
      serviceId,
      month,
      year,
      status,
    })

    const filters: any = {}
    if (month) filters.month = Number.parseInt(month)
    if (year) filters.year = Number.parseInt(year)
    if (status) filters.status = status

    // Obtener TODOS los pagos sin límite
    let payments = await getServicePayments(hotelId || undefined, filters)

    console.log("📊 API: Pagos obtenidos antes de filtrar por serviceId:", payments.length)

    // Filtrar por service_id si se proporciona
    if (serviceId) {
      const beforeFilter = payments.length
      payments = payments.filter((payment) => payment.service_id === serviceId)
      console.log(`🔍 API: Filtrado por serviceId ${serviceId}: ${beforeFilter} -> ${payments.length}`)
    }

    console.log("✅ API: Retornando pagos:", payments.length)

    return NextResponse.json(payments)
  } catch (error) {
    console.error("❌ API: Error fetching service payments:", error)
    return NextResponse.json({ error: "Failed to fetch service payments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 API: Creando nuevo pago...")

    const body = await request.json()
    console.log("📝 API: Datos del pago a crear:", body)

    const payment = await addServicePayment(body)

    console.log("✅ API: Pago creado exitosamente:", payment.id)

    return NextResponse.json(payment)
  } catch (error) {
    console.error("❌ API: Error creating service payment:", error)
    return NextResponse.json({ error: "Failed to create service payment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("🔄 API: Actualizando pago...")

    const body = await request.json()
    const { id, ...updates } = body

    console.log("📝 API: Actualizando pago ID:", id, "con datos:", updates)

    await updateServicePayment(id, updates)

    console.log("✅ API: Pago actualizado exitosamente")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ API: Error updating service payment:", error)
    return NextResponse.json({ error: "Failed to update service payment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("🔄 API: Eliminando pago...")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      console.error("❌ API: ID de pago requerido")
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    console.log("🗑️ API: Eliminando pago ID:", id)

    await deleteServicePayment(id)

    console.log("✅ API: Pago eliminado exitosamente")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ API: Error deleting service payment:", error)
    return NextResponse.json({ error: "Failed to delete service payment" }, { status: 500 })
  }
}
