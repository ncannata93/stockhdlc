import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET() {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL

    if (!resendApiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 })
    }

    if (!adminEmail) {
      return NextResponse.json({ error: "ADMIN_NOTIFICATION_EMAIL no configurada" }, { status: 500 })
    }

    const resend = new Resend(resendApiKey)

    const { data, error } = await resend.emails.send({
      from: "Sistema de Pagos <onboarding@resend.dev>",
      to: adminEmail,
      subject: "Email de Prueba - Sistema de Notificaciones",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
            .check-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .check-mark { color: #10b981; font-weight: bold; margin-right: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✓</div>
              <h1 style="margin: 0;">Configuracion Exitosa</h1>
            </div>
            <div class="content">
              <p>Este es un email de prueba para confirmar que el sistema de notificaciones esta funcionando correctamente.</p>
              
              <h3>Estado de la configuracion:</h3>
              <div class="check-item">
                <span class="check-mark">✓</span>
                <span>RESEND_API_KEY configurada correctamente</span>
              </div>
              <div class="check-item">
                <span class="check-mark">✓</span>
                <span>ADMIN_NOTIFICATION_EMAIL: ${adminEmail}</span>
              </div>
              <div class="check-item">
                <span class="check-mark">✓</span>
                <span>Envio de emails funcionando</span>
              </div>
              
              <p style="margin-top: 20px;">
                <strong>Proximo paso:</strong> El sistema verificara automaticamente los pagos vencidos todos los dias a las 8:00 AM (UTC) y te enviara un resumen si hay pagos pendientes.
              </p>
              
              <div class="footer">
                <p>Sistema de Gestion de Hoteles - Stock HDLC</p>
                <p>Fecha de prueba: ${new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error enviando email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Email de prueba enviado a ${adminEmail}`,
      emailId: data?.id 
    })

  } catch (error) {
    console.error("Error en test-email:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Error desconocido" 
    }, { status: 500 })
  }
}
