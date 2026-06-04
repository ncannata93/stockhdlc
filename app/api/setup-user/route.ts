import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Esta ruta solo debe ejecutarse una vez para crear el usuario inicial
// Luego debe eliminarse o protegerse

export async function POST(request: Request) {
  try {
    const { secret } = await request.json()
    
    // Validar que se proporcione un secreto para evitar creación no autorizada
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Usar el service role key para crear usuarios
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Primero, eliminar todas las sesiones existentes de todos los usuarios
    // Esto se hace eliminando los refresh tokens
    
    // Crear el usuario mallak@limpieza.local con la contraseña colapinto
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'mallak@limpieza.local',
      password: 'colapinto',
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        username: 'mallak'
      }
    })

    if (error) {
      // Si el usuario ya existe, intentar actualizar la contraseña
      if (error.message.includes('already been registered')) {
        // Obtener el usuario existente
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === 'mallak@limpieza.local')
        
        if (existingUser) {
          // Cerrar todas las sesiones del usuario
          await supabaseAdmin.auth.admin.signOut(existingUser.id, 'global')
          
          // Actualizar la contraseña
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password: 'colapinto' }
          )
          
          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 })
          }
          
          return NextResponse.json({ 
            message: 'Usuario actualizado y todas las sesiones cerradas',
            email: 'mallak@limpieza.local'
          })
        }
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Usuario creado exitosamente',
      email: 'mallak@limpieza.local',
      userId: data.user?.id
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
