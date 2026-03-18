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
      from: "Hoteles de la Costa <notificaciones@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `Atencion: ${overduePayments.length} pago${overduePayments.length > 1 ? 's' : ''} requiere${overduePayments.length > 1 ? 'n' : ''} tu atencion`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header con gradiente -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        Hoteles de la Costa
                      </h1>
                      <p style="color: #94b8d4; margin: 8px 0 0 0; font-size: 14px;">
                        Sistema de Gestion de Servicios
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Alerta Banner -->
                  <tr>
                    <td style="padding: 0 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; margin-top: -20px; border-left: 4px solid #f59e0b;">
                        <tr>
                          <td style="padding: 20px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="50" valign="top">
                                  <div style="width: 44px; height: 44px; background-color: #f59e0b; border-radius: 50%; text-align: center; line-height: 44px;">
                                    <span style="font-size: 22px;">!</span>
                                  </div>
                                </td>
                                <td style="padding-left: 16px;">
                                  <h2 style="color: #92400e; margin: 0; font-size: 18px; font-weight: 600;">
                                    Pagos Pendientes de Atencion
                                  </h2>
                                  <p style="color: #a16207; margin: 4px 0 0 0; font-size: 14px;">
                                    ${overduePayments.length} servicio${overduePayments.length > 1 ? 's han' : ' ha'} alcanzado su fecha de vencimiento
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Contenido Principal -->
                  <tr>
                    <td style="padding: 32px 40px 20px 40px;">
                      <p style="color: #475569; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
                        Hola! Te informamos que los siguientes pagos de servicios necesitan tu atencion:
                      </p>
                      
                      <!-- Tabla de pagos -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                        <thead>
                          <tr style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);">
                            <th style="padding: 14px 16px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hotel</th>
                            <th style="padding: 14px 16px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Servicio</th>
                            <th style="padding: 14px 16px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Periodo</th>
                            <th style="padding: 14px 16px; text-align: right; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${overduePayments.map((p, index) => {
                            const service = p.services as any
                            const hotelName = service?.hotels?.name || "N/A"
                            const serviceName = service?.name || "N/A"
                            const monthName = MONTHS[p.month] || p.month
                            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'
                            return `
                              <tr style="background-color: ${bgColor};">
                                <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e2e8f0;">${hotelName}</td>
                                <td style="padding: 14px 16px; color: #475569; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${serviceName}</td>
                                <td style="padding: 14px 16px; color: #475569; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${monthName} ${p.year}</td>
                                <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(p.amount)}</td>
                              </tr>
                            `
                          }).join("")}
                        </tbody>
                      </table>
                      
                      <!-- Total -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                        <tr>
                          <td style="text-align: right;">
                            <table cellpadding="0" cellspacing="0" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 10px; padding: 16px 24px;">
                              <tr>
                                <td style="color: #fecaca; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                                  Total Pendiente
                                </td>
                              </tr>
                              <tr>
                                <td style="color: #ffffff; font-size: 28px; font-weight: 700;">
                                  ${formatCurrency(totalAmount)}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Call to Action -->
                  <tr>
                    <td style="padding: 20px 40px 32px 40px; text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stockhdlc.vercel.app'}/servicios" 
                         style="display: inline-block; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 14px rgba(30, 58, 95, 0.4);">
                        Ver Pagos en el Sistema
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #64748b; font-size: 13px; line-height: 1.5;">
                            <p style="margin: 0 0 8px 0;">
                              Este es un mensaje automatico del sistema de gestion.
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                              Verificacion realizada el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
                
                <!-- Footer externo -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                  <tr>
                    <td style="text-align: center; color: #94a3b8; font-size: 12px;">
                      <p style="margin: 0;">
                        Hoteles de la Costa - Sistema de Gestion
                      </p>
                    </td>
                  </tr>
                </table>
                
              </td>
            </tr>
          </table>
        </body>
        </html>
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
