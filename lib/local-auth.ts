// Sistema de autenticación local que almacena usuarios y sesiones en localStorage

// Tipos para el sistema de autenticación local
export interface LocalUser {
  id: string
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

// Función para generar un ID único
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

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
      username: "usuario",
      password: "usuario123",
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
        id: generateId(),
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

// Función para obtener todos los usuarios locales
export function getLocalUsers(): LocalUser[] {
  try {
    if (typeof window === "undefined") return []

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
      id: generateId(),
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

    return { success: true, error: null, session }
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    return { success: false, error: "Error al iniciar sesión", session: null }
  }
}

// Función para cerrar sesión
export function logoutLocalUser(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(LOCAL_SESSION_KEY)
}

// Función para obtener la sesión actual
export function getCurrentLocalSession(): LocalSession | null {
  try {
    if (typeof window === "undefined") return null

    const sessionJson = localStorage.getItem(LOCAL_SESSION_KEY)
    if (!sessionJson) return null

    const session: LocalSession = JSON.parse(sessionJson)

    // Verificar si la sesión ha expirado
    const now = new Date()
    const expiresAt = new Date(session.expiresAt)

    if (now > expiresAt) {
      // La sesión ha expirado, eliminarla
      logoutLocalUser()
      return null
    }

    return session
  } catch (error) {
    console.error("Error al obtener sesión actual:", error)
    return null
  }
}

// Asumiendo que este archivo ya existe, solo necesitamos asegurarnos de que exporte la función usernameToEmail
// Si no existe, necesitamos crearlo con la función requerida

// Esta es una implementación básica si no existe
export function usernameToEmail(username: string): string {
  // Convertir el nombre de usuario a un formato de correo electrónico
  return `${username.toLowerCase()}@example.com`
}
