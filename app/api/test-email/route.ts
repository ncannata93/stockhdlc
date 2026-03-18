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
      from: "Hoteles de la Costa <onboarding@resend.dev>",
      to: adminEmail,
      subject: "Configuracion Exitosa - Sistema de Notificaciones",
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
                  
                  <!-- Success Banner -->
                  <tr>
                    <td style="padding: 0 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; margin-top: -20px; border-left: 4px solid #10b981;">
                        <tr>
                          <td style="padding: 20px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="50" valign="top">
                                  <div style="width: 44px; height: 44px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 44px; color: white; font-size: 24px; font-weight: bold;">
                                    OK
                                  </div>
                                </td>
                                <td style="padding-left: 16px;">
                                  <h2 style="color: #065f46; margin: 0; font-size: 18px; font-weight: 600;">
                                    Configuracion Exitosa
                                  </h2>
                                  <p style="color: #047857; margin: 4px 0 0 0; font-size: 14px;">
                                    El sistema de notificaciones esta listo para funcionar
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
                        Hola! Este email confirma que el sistema de notificaciones esta configurado correctamente.
                      </p>
                      
                      <!-- Checklist -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; padding: 20px;">
                        <tr>
                          <td>
                            <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
                              Estado de la configuracion:
                            </h3>
                            
                            <!-- Item 1 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                              <tr>
                                <td width="28">
                                  <div style="width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 14px;">+</div>
                                </td>
                                <td style="padding-left: 12px; color: #475569; font-size: 14px;">
                                  API Key de Resend configurada correctamente
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Item 2 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                              <tr>
                                <td width="28">
                                  <div style="width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 14px;">+</div>
                                </td>
                                <td style="padding-left: 12px; color: #475569; font-size: 14px;">
                                  Email de notificaciones: <strong>${adminEmail}</strong>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Item 3 -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="28">
                                  <div style="width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 14px;">+</div>
                                </td>
                                <td style="padding-left: 12px; color: #475569; font-size: 14px;">
                                  Sistema de envio de emails funcionando
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Info box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
                        <tr>
                          <td style="padding: 20px 24px;">
                            <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                              Que sigue?
                            </h4>
                            <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.5;">
                              El sistema verificara automaticamente los pagos vencidos <strong>todos los dias a las 8:00 AM</strong> (hora UTC) y te enviara un resumen si hay pagos pendientes de atencion.
                            </p>
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
                        Ir al Sistema
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center; color: #64748b; font-size: 13px; line-height: 1.5;">
                            <p style="margin: 0 0 8px 0;">
                              Este es un email de prueba del sistema.
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                              Enviado el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
