import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Esta ruta crea el usuario inicial del sistema

export async function POST() {
  try {
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

    // Crear el usuario mallak@limpieza.local con la contraseña colapinto
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'mallak@limpieza.local',
      password: 'colapinto',
      email_confirm: true,
      user_metadata: {
        username: 'mallak'
      }
    })

    if (error) {
      // Si el usuario ya existe, actualizar la contraseña y cerrar sesiones
      if (error.message.includes('already been registered')) {
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
            message: 'Usuario reseteado exitosamente. Todas las sesiones fueron cerradas. Ya puedes iniciar sesión.'
          })
        }
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Usuario creado exitosamente. Ya puedes iniciar sesión.'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
