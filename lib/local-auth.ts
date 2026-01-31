// Tipos para autenticación local
export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResult {
  success: boolean
  message: string
  user?: LocalUser
}

export interface LocalUser {
  id: string
  username: string
  email: string
  fullName: string
  role: "admin" | "user" | "stockarg_only"
  createdAt: string
  allowedRoutes?: string[]
}

// Usuarios predefinidos del sistema
const PREDEFINED_USERS: LocalUser[] = [
  {
    id: "1",
    username: "ncannata",
    email: "ncannata@hotelescosta.com",
    fullName: "Nacho Cannata",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    username: "admin",
    email: "admin@hotelescosta.com",
    fullName: "Administrador",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    username: "dpili",
    email: "dpili@hotelescosta.com",
    fullName: "Diego Pili",
    role: "user",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    username: "jprey",
    email: "jprey@hotelescosta.com",
    fullName: "Juan Pablo Rey",
    role: "user",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    username: "ruben",
    email: "ruben@hotelescosta.com",
    fullName: "Ruben",
    role: "stockarg_only",
    createdAt: "2024-01-01T00:00:00Z",
    allowedRoutes: ["/stockarg"],
  },
]

// Credenciales de usuarios
const USER_CREDENTIALS: Record<string, string> = {
  ncannata: "nacho1234N",
  admin: "admin123",
  dpili: "pili123",
  jprey: "qw425540",
  ruben: "pincha123",
}

// Función para verificar si localStorage está disponible
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false
    const test = "__localStorage_test__"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Función para obtener usuario por username
function getUserByUsername(username: string): LocalUser | null {
  return PREDEFINED_USERS.find((user) => user.username === username) || null
}

// Función principal de login
export async function signIn(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    console.log("Intentando login para:", credentials.username)

    // Verificar credenciales
    const expectedPassword = USER_CREDENTIALS[credentials.username]

    if (!expectedPassword) {
      console.log("Usuario no encontrado:", credentials.username)
      return {
        success: false,
        message: "Usuario no encontrado",
      }
    }

    if (credentials.password !== expectedPassword) {
      console.log("Contraseña incorrecta para:", credentials.username)
      return {
        success: false,
        message: "Contraseña incorrecta",
      }
    }

    // Obtener datos del usuario
    const user = getUserByUsername(credentials.username)

    if (!user) {
      console.log("Datos de usuario no encontrados:", credentials.username)
      return {
        success: false,
        message: "Error interno del sistema",
      }
    }

    // Crear sesión
    const session = {
      user,
      token: `token_${Date.now()}_${Math.random()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      createdAt: new Date().toISOString(),
    }

    // Guardar en localStorage si está disponible
    if (isLocalStorageAvailable()) {
      localStorage.setItem("auth_session", JSON.stringify(session))
      localStorage.setItem("current_user", JSON.stringify(user))
      console.log("Sesión guardada en localStorage")
    }

    console.log("Login exitoso para:", user.fullName)

    return {
      success: true,
      message: `Bienvenido, ${user.fullName}`,
      user,
    }
  } catch (error) {
    console.error("Error en signIn:", error)
    return {
      success: false,
      message: "Error interno del sistema",
    }
  }
}

// Función para cerrar sesión
export async function signOut(): Promise<void> {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem("auth_session")
      localStorage.removeItem("current_user")
      console.log("Sesión cerrada y localStorage limpiado")
    }
  } catch (error) {
    console.error("Error en signOut:", error)
  }
}

// Función para obtener usuario actual
export function getCurrentUser(): LocalUser | null {
  try {
    if (!isLocalStorageAvailable()) return null

    const userStr = localStorage.getItem("current_user")
    if (!userStr) return null

    const user = JSON.parse(userStr)
    console.log("Usuario actual obtenido:", user.fullName)
    return user
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error)
    return null
  }
}

// Función para verificar si hay sesión activa
export function hasActiveSession(): boolean {
  try {
    if (!isLocalStorageAvailable()) return false

    const sessionStr = localStorage.getItem("auth_session")
    if (!sessionStr) return false

    const session = JSON.parse(sessionStr)
    const now = new Date()
    const expiresAt = new Date(session.expiresAt)

    const isActive = now < expiresAt
    console.log("Verificación de sesión activa:", isActive)

    if (!isActive) {
      // Limpiar sesión expirada
      localStorage.removeItem("auth_session")
      localStorage.removeItem("current_user")
      console.log("Sesión expirada, localStorage limpiado")
    }

    return isActive
  } catch (error) {
    console.error("Error verificando sesión activa:", error)
    return false
  }
}

// Función para asegurar que los usuarios predefinidos existen
export function ensurePredefinedUsers(): void {
  console.log("Usuarios predefinidos disponibles:", PREDEFINED_USERS.length)
  PREDEFINED_USERS.forEach((user) => {
    console.log(`- ${user.username} (${user.fullName}) - ${user.role}`)
  })
}

// Inicializar usuarios al cargar el módulo
ensurePredefinedUsers()
