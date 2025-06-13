// Tipos para la autenticación local
export interface LocalUser {
  id: string
  username: string
  email: string
  password: string
  isAdmin: boolean
  createdAt: string
  lastLogin?: string
}

export interface LocalSession {
  id: string
  userId: string
  username: string
  email: string
  isAdmin: boolean
  createdAt: string
  expiresAt: string
}

// Constantes para almacenamiento local
const LOCAL_USERS_KEY = "hotel_management_users"
const LOCAL_SESSION_KEY = "hotel_management_session"

// Función para generar un ID único
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Función para convertir nombre de usuario a email
export const usernameToEmail = (username: string): string => {
  return `${username}@hotelesdelacosta.com`
}

// Obtener usuarios locales
export const getLocalUsers = (): LocalUser[] => {
  if (typeof window === "undefined") return []

  const usersJson = localStorage.getItem(LOCAL_USERS_KEY)
  if (!usersJson) return []

  try {
    return JSON.parse(usersJson)
  } catch (error) {
    console.error("Error parsing local users:", error)
    return []
  }
}

// Guardar usuarios locales
const saveLocalUsers = (users: LocalUser[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

// Crear usuario local
export const createLocalUser = (
  username: string,
  password: string,
  isAdmin = false,
): { success: boolean; error: string | null } => {
  if (!username || !password) {
    return { success: false, error: "Nombre de usuario y contraseña son requeridos" }
  }

  const users = getLocalUsers()

  // Verificar si el usuario ya existe
  if (users.some((user) => user.username === username)) {
    return { success: false, error: "El usuario ya existe" }
  }

  const newUser: LocalUser = {
    id: generateId(),
    username,
    email: usernameToEmail(username),
    password, // En una aplicación real, deberíamos hashear la contraseña
    isAdmin,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  saveLocalUsers(users)

  return { success: true, error: null }
}

// Iniciar sesión con usuario local
export const loginLocalUser = (
  username: string,
  password: string,
): { success: boolean; error: string | null; session: LocalSession | null } => {
  const users = getLocalUsers()
  const user = users.find((u) => u.username === username)

  if (!user) {
    return { success: false, error: "Usuario no encontrado", session: null }
  }

  if (user.password !== password) {
    return { success: false, error: "Contraseña incorrecta", session: null }
  }

  // Crear sesión
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 horas

  const session: LocalSession = {
    id: generateId(),
    userId: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  // Actualizar último inicio de sesión
  const updatedUsers = users.map((u) => {
    if (u.id === user.id) {
      return { ...u, lastLogin: now.toISOString() }
    }
    return u
  })

  saveLocalUsers(updatedUsers)
  saveLocalSession(session)

  return { success: true, error: null, session }
}

// Guardar sesión local
const saveLocalSession = (session: LocalSession | null): void => {
  if (typeof window === "undefined") return

  if (session) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY)
  }
}

// Obtener sesión actual
export const getCurrentLocalSession = (): LocalSession | null => {
  if (typeof window === "undefined") return null

  const sessionJson = localStorage.getItem(LOCAL_SESSION_KEY)
  if (!sessionJson) return null

  try {
    const session = JSON.parse(sessionJson) as LocalSession

    // Verificar si la sesión ha expirado
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(LOCAL_SESSION_KEY)
      return null
    }

    return session
  } catch (error) {
    console.error("Error parsing local session:", error)
    return null
  }
}

// Cerrar sesión
export const logoutLocalUser = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem(LOCAL_SESSION_KEY)
}

// Asegurar que existan usuarios predefinidos
export const ensurePredefinedUsers = (): void => {
  const users = getLocalUsers()

  // Si no hay usuarios, crear los predefinidos
  if (users.length === 0) {
    // Crear usuario admin
    createLocalUser("admin", "admin123", true)

    // Crear algunos usuarios normales
    createLocalUser("usuario1", "password1")
    createLocalUser("usuario2", "password2")
  }
}
