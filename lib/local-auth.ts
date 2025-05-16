// Sistema de autenticación local que no depende de Supabase
// Almacena usuarios y sesiones en localStorage

// Tipos para el sistema de autenticación local
export interface LocalUser {
  username: string
  password: string // En una aplicación real, esto debería ser un hash
  isAdmin: boolean
  createdAt: string
}

export interface LocalSession {
  username: string
  isAdmin: boolean
  createdAt: string
  expiresAt: string
}

// Constantes
const LOCAL_USERS_KEY = "local_users"
const LOCAL_SESSION_KEY = "local_session"
const SESSION_DURATION_DAYS = 7

// Función para inicializar el sistema de autenticación local
export function ensurePredefinedUsers() {
  // Obtener usuarios actuales
  const users = getLocalUsers()

  // Lista de usuarios predefinidos que siempre deben existir
  const predefinedUsers = [
    {
      username: "admin",
      password: "admin123",
      isAdmin: true,
    },
    {
      username: "ncannata",
      password: "nacho1234N",
      isAdmin: true,
    },
    {
      username: "dpili",
      password: "pili123",
      isAdmin: false,
    },
    {
      username: "jprey",
      password: "qw425540",
      isAdmin: false,
    },
  ]

  let usersChanged = false

  // Verificar cada usuario predefinido
  predefinedUsers.forEach((predefinedUser) => {
    // Comprobar si el usuario ya existe
    const userExists = users.some((user) => user.username.toLowerCase() === predefinedUser.username.toLowerCase())

    // Si no existe, añadirlo
    if (!userExists) {
      users.push({
        ...predefinedUser,
        createdAt: new Date().toISOString(),
      })
      usersChanged = true
      console.log(`Usuario predefinido creado: ${predefinedUser.username}`)
    }
  })

  // Si se añadió algún usuario, guardar la lista actualizada
  if (usersChanged) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
    console.log("Lista de usuarios actualizada con usuarios predefinidos")
  }

  return users
}

// Modificar la función initLocalAuth para usar ensurePredefinedUsers
export function initLocalAuth() {
  try {
    // Verificar si ya hay usuarios creados
    const users = getLocalUsers()

    // Si no hay usuarios, crear los usuarios predefinidos
    if (users.length === 0) {
      const predefinedUsers: LocalUser[] = [
        {
          username: "admin",
          password: "admin123",
          isAdmin: true,
          createdAt: new Date().toISOString(),
        },
        {
          username: "ncannata",
          password: "nacho1234N",
          isAdmin: true,
          createdAt: new Date().toISOString(),
        },
        {
          username: "dpili",
          password: "pili123",
          isAdmin: false,
          createdAt: new Date().toISOString(),
        },
        {
          username: "jprey",
          password: "qw425540",
          isAdmin: false,
          createdAt: new Date().toISOString(),
        },
      ]

      // Guardar los usuarios predefinidos
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(predefinedUsers))
      console.log("Usuarios predefinidos creados inicialmente")
    } else {
      // Asegurarse de que los usuarios predefinidos existan
      ensurePredefinedUsers()
    }
  } catch (error) {
    console.error("Error en initLocalAuth:", error)
  }
}

// Función para obtener todos los usuarios locales
export function getLocalUsers(): LocalUser[] {
  try {
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY)
    return usersJson ? JSON.parse(usersJson) : []
  } catch (error) {
    console.error("Error al obtener usuarios locales:", error)
    return []
  }
}

// Función para obtener un usuario por nombre de usuario
export function getLocalUserByUsername(username: string): LocalUser | null {
  const users = getLocalUsers()
  return users.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null
}

// Función para crear un nuevo usuario local
export function createLocalUser(
  username: string,
  password: string,
  isAdmin = false,
): { success: boolean; error: string | null } {
  try {
    // Validar que el nombre de usuario no esté vacío
    if (!username.trim()) {
      return { success: false, error: "El nombre de usuario no puede estar vacío" }
    }

    // Validar que la contraseña tenga al menos 6 caracteres
    if (password.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres" }
    }

    // Verificar si el usuario ya existe
    const existingUser = getLocalUserByUsername(username)
    if (existingUser) {
      return { success: false, error: "El nombre de usuario ya está en uso" }
    }

    // Crear el nuevo usuario
    const newUser: LocalUser = {
      username,
      password, // En una aplicación real, esto debería ser un hash
      isAdmin,
      createdAt: new Date().toISOString(),
    }

    // Obtener la lista actual de usuarios y añadir el nuevo
    const users = getLocalUsers()
    users.push(newUser)

    // Guardar la lista actualizada
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))

    return { success: true, error: null }
  } catch (error) {
    console.error("Error al crear usuario local:", error)
    return { success: false, error: "Error al crear usuario" }
  }
}

// Función para iniciar sesión con un usuario local
export function loginLocalUser(
  username: string,
  password: string,
): { success: boolean; error: string | null; session: LocalSession | null } {
  try {
    // Buscar el usuario
    const user = getLocalUserByUsername(username)

    // Verificar si el usuario existe
    if (!user) {
      return { success: false, error: "Usuario no encontrado", session: null }
    }

    // Verificar la contraseña
    if (user.password !== password) {
      return { success: false, error: "Contraseña incorrecta", session: null }
    }

    // Crear una sesión
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(now.getDate() + SESSION_DURATION_DAYS)

    const session: LocalSession = {
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    // Guardar la sesión
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
    console.log("loginLocalUser: Sesión creada y guardada", session)

    return { success: true, error: null, session }
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    return { success: false, error: "Error al iniciar sesión", session: null }
  }
}

// Función para cerrar sesión
export function logoutLocalUser(): void {
  localStorage.removeItem(LOCAL_SESSION_KEY)
}

// Función para obtener la sesión actual
export function getCurrentLocalSession(): LocalSession | null {
  try {
    if (typeof window === "undefined") {
      console.log("getCurrentLocalSession: No estamos en el cliente")
      return null
    }

    const sessionJson = localStorage.getItem(LOCAL_SESSION_KEY)
    if (!sessionJson) {
      console.log("getCurrentLocalSession: No hay sesión en localStorage")
      return null
    }

    const session: LocalSession = JSON.parse(sessionJson)
    console.log("getCurrentLocalSession: Sesión encontrada", session)

    // Verificar si la sesión ha expirado
    const now = new Date()
    const expiresAt = new Date(session.expiresAt)

    if (now > expiresAt) {
      // La sesión ha expirado, eliminarla
      console.log("getCurrentLocalSession: La sesión ha expirado")
      logoutLocalUser()
      return null
    }

    return session
  } catch (error) {
    console.error("Error al obtener sesión actual:", error)
    return null
  }
}

// Añadir esta función al final del archivo si no existe:
export function usernameToEmail(username: string): string {
  // Convertir el nombre de usuario a un formato de correo electrónico
  return `${username.toLowerCase()}@example.com`
}
