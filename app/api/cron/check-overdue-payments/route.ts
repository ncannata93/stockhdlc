import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

// Esta ruta se ejecuta diariamente via Vercel Cron
// Verifica pagos vencidos y envia emails de notificacion

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@example.com"

export async function GET(request: Request) {
  // Verificar que la solicitud viene de Vercel Cron (en produccion)
  const authHeader = request.headers.get("authorization")
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]

    // Buscar pagos que vencen hoy y estan pendientes
    const { data: overduePayments, error } = await supabase
      .from("service_payments")
      .select(`
        id,
        amount,
        due_date,
        month,
        year,
        status,
        services (
          name,
          hotels (
            name
          )
        )
      `)
      .eq("status", "pendiente")
      .lte("due_date", todayStr)

    if (error) {
      console.error("Error fetching overdue payments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!overduePayments || overduePayments.length === 0) {
      return NextResponse.json({ 
        message: "No hay pagos vencidos pendientes",
        checked: todayStr 
      })
    }

    // Actualizar estado a "vencido" para los que vencieron
    const overdueIds = overduePayments.map(p => p.id)
    await supabase
      .from("service_payments")
      .update({ status: "vencido" })
      .in("id", overdueIds)

    // Preparar contenido del email
    const MONTHS: Record<number, string> = {
      1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
      5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
      9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "USD"
      }).format(amount)
    }

    const paymentsList = overduePayments.map(p => {
      const service = p.services as any
      const hotelName = service?.hotels?.name || "Hotel desconocido"
      const serviceName = service?.name || "Servicio desconocido"
      const monthName = MONTHS[p.month] || p.month
      return `- ${hotelName} | ${serviceName} | ${monthName} ${p.year} | ${formatCurrency(p.amount)} | Vence: ${p.due_date}`
    }).join("\n")

    const totalAmount = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0)

    // Enviar email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Sistema de Pagos <notificaciones@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `⚠️ ${overduePayments.length} pago(s) vencido(s) - ${todayStr}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⚠️ Notificación de Pagos Vencidos</h2>
          
          <p>Se han detectado <strong>${overduePayments.length} pago(s)</strong> que han vencido:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Hotel</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Servicio</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Período</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${overduePayments.map(p => {
                const service = p.services as any
                const hotelName = service?.hotels?.name || "N/A"
                const serviceName = service?.name || "N/A"
                const monthName = MONTHS[p.month] || p.month
                return `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${hotelName}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${serviceName}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${monthName} ${p.year}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(p.amount)}</td>
                  </tr>
                `
              }).join("")}
            </tbody>
            <tfoot>
              <tr style="background-color: #fee2e2;">
                <td colspan="3" style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Total Vencido</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold; color: #dc2626;">${formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          
          <p style="color: #6b7280; font-size: 14px;">
            Este es un mensaje automático del Sistema de Gestión de Servicios.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px;">
            Fecha de verificación: ${todayStr}
          </p>
        </div>
      `,
      text: `
NOTIFICACIÓN DE PAGOS VENCIDOS

Se han detectado ${overduePayments.length} pago(s) que han vencido:

${paymentsList}

Total vencido: ${formatCurrency(totalAmount)}

---
Este es un mensaje automático del Sistema de Gestión de Servicios.
Fecha: ${todayStr}
      `
    })

    if (emailError) {
      console.error("Error sending email:", emailError)
      return NextResponse.json({ 
        error: "Error enviando email",
        details: emailError,
        paymentsUpdated: overdueIds.length
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Se notificaron ${overduePayments.length} pagos vencidos`,
      paymentsUpdated: overdueIds.length,
      emailSent: true,
      emailId: emailData?.id,
      checked: todayStr
    })

  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
