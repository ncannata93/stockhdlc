// Tipos para Firebase
export type FirebaseProduct = {
  id: number
  name: string
  unit: string
  price: number
  min_stock: number
}

export type FirebaseInventoryItem = {
  productId: number
  quantity: number
}

export type FirebaseRecord = {
  id: number
  hotelId: number | null
  hotelName: string | null
  productId: number
  productName: string
  productUnit: string
  quantity: number
  price: number
  date: any // Usamos any para evitar importar Timestamp en el servidor
  type: "entrada" | "salida"
}

// Estado de Firebase
let isFirebaseInitialized = false
let firebaseError: string | null = null
let isInitializing = false

// Función para inicializar Firebase (solo en el cliente)
export const initializeFirebase = async () => {
  // Solo ejecutar en el cliente
  if (typeof window === "undefined") {
    return { success: false, error: "No se puede inicializar Firebase en el servidor" }
  }

  // Si ya está inicializado, retornar éxito
  if (isFirebaseInitialized) {
    return { success: true, error: null }
  }

  // Si ya está en proceso de inicialización, esperar
  if (isInitializing) {
    // Esperar hasta 5 segundos para que termine la inicialización
    let attempts = 0
    while (isInitializing && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    // Verificar si se inicializó correctamente
    if (isFirebaseInitialized) {
      return { success: true, error: null }
    } else {
      return { success: false, error: firebaseError || "Tiempo de espera agotado" }
    }
  }

  isInitializing = true

  try {
    console.log("Iniciando importación de módulos Firebase...")

    // Importar Firebase dinámicamente (solo en el cliente)
    const firebaseApp = await import("firebase/app").catch((error) => {
      console.error("Error al importar firebase/app:", error)
      throw new Error("No se pudo cargar el módulo firebase/app")
    })

    const firebaseFirestore = await import("firebase/firestore").catch((error) => {
      console.error("Error al importar firebase/firestore:", error)
      throw new Error("No se pudo cargar el módulo firebase/firestore")
    })

    console.log("Módulos Firebase importados correctamente")

    // Configuración de Firebase - Actualizada con valores reales pero ocultos
    const firebaseConfig = {
      apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authDomain: "hoteles-de-la-costa.firebaseapp.com",
      projectId: "hoteles-de-la-costa",
      storageBucket: "hoteles-de-la-costa.appspot.com",
      messagingSenderId: "xxxxxxxxxxxx",
      appId: "1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxx",
    }

    console.log("Inicializando Firebase con configuración:", { ...firebaseConfig, apiKey: "***OCULTO***" })

    // Inicializar Firebase
    let app
    if (firebaseApp.getApps().length === 0) {
      console.log("Creando nueva instancia de Firebase")
      app = firebaseApp.initializeApp(firebaseConfig)
    } else {
      console.log("Usando instancia existente de Firebase")
      app = firebaseApp.getApp()
    }

    // Inicializar Firestore con manejo de errores mejorado
    console.log("Inicializando Firestore...")
    let db
    try {
      db = firebaseFirestore.getFirestore(app)
      console.log("Firestore inicializado correctamente")
    } catch (error) {
      console.error("Error al inicializar Firestore:", error)
      throw new Error(`Error al inicializar Firestore: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Verificar la conexión a Firestore con una operación simple y manejo de errores mejorado
    console.log("Verificando conexión a Firestore...")
    try {
      // Intentar una operación simple para verificar la conexión
      const testCollection = firebaseFirestore.collection(db, "test-connection")
      await firebaseFirestore.getDocs(testCollection)
      console.log("Verificación de conexión completada")
    } catch (error) {
      console.log("Error en la verificación de conexión:", error)
      // No lanzamos error aquí, ya que es posible que la colección no exista
      // pero queremos asegurarnos de que Firestore esté disponible

      // Intentar crear un documento para verificar que Firestore funciona
      try {
        const testCollection = firebaseFirestore.collection(db, "test-connection")
        await firebaseFirestore.addDoc(testCollection, { test: true, timestamp: new Date() })
        console.log("Documento de prueba creado correctamente")
      } catch (testError) {
        console.error("Error al crear documento de prueba:", testError)
        throw new Error(
          `Firestore no está disponible: ${testError instanceof Error ? testError.message : String(testError)}`,
        )
      }
    }
    // Guardar las referencias en el objeto global window
    ;(window as any).__FIREBASE_APP__ = app
    ;(window as any).__FIREBASE_DB__ = db
    ;(window as any).__FIREBASE_FIRESTORE__ = firebaseFirestore

    isFirebaseInitialized = true
    firebaseError = null
    console.log("Firebase inicializado correctamente")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error al inicializar Firebase:", error)
    isFirebaseInitialized = false
    firebaseError = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: firebaseError }
  } finally {
    isInitializing = false
  }
}

// Función para verificar si Firebase está disponible
export const isFirebaseAvailable = () => {
  try {
    return typeof window !== "undefined" && isFirebaseInitialized && (window as any).__FIREBASE_DB__ !== undefined
  } catch (error) {
    console.error("Error al verificar disponibilidad de Firebase:", error)
    return false
  }
}

// Función para obtener la instancia de Firestore
const getFirestore = () => {
  if (!isFirebaseAvailable()) {
    throw new Error("Firebase no está disponible")
  }
  return (window as any).__FIREBASE_DB__
}

// Función para obtener el módulo Firestore
const getFirestoreModule = () => {
  if (!isFirebaseAvailable()) {
    throw new Error("Firebase no está disponible")
  }
  return (window as any).__FIREBASE_FIRESTORE__
}

// Funciones para productos
export const saveProduct = async (product: FirebaseProduct) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return false
  }

  try {
    console.log("Guardando producto en Firebase:", product)
    const db = getFirestore()
    const firestore = getFirestoreModule()

    await firestore.setDoc(firestore.doc(db, "products", product.id.toString()), product)
    console.log("Producto guardado correctamente")
    return true
  } catch (error) {
    console.error("Error al guardar producto:", error)
    return false
  }
}

export const saveProducts = async (products: FirebaseProduct[]) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return false
  }

  try {
    console.log("Guardando productos en Firebase:", products)
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const batch = firestore.writeBatch(db)

    products.forEach((product) => {
      const docRef = firestore.doc(db, "products", product.id.toString())
      batch.set(docRef, product)
    })

    await batch.commit()
    console.log("Productos guardados correctamente")
    return true
  } catch (error) {
    console.error("Error al guardar productos:", error)
    return false
  }
}

export const getProducts = async (): Promise<FirebaseProduct[]> => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return []
  }

  try {
    console.log("Obteniendo productos de Firebase")
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const querySnapshot = await firestore.getDocs(firestore.collection(db, "products"))
    const products: FirebaseProduct[] = []
    querySnapshot.forEach((doc) => {
      products.push(doc.data() as FirebaseProduct)
    })
    console.log("Productos obtenidos:", products)
    return products
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

// Funciones para inventario
export const saveInventoryItem = async (item: FirebaseInventoryItem) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return false
  }

  try {
    console.log("Guardando item de inventario en Firebase:", item)
    const db = getFirestore()
    const firestore = getFirestoreModule()

    await firestore.setDoc(firestore.doc(db, "inventory", item.productId.toString()), item)
    console.log("Item de inventario guardado correctamente")
    return true
  } catch (error) {
    console.error("Error al guardar item de inventario:", error)
    return false
  }
}

export const saveInventory = async (inventory: FirebaseInventoryItem[]) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return false
  }

  try {
    console.log("Guardando inventario en Firebase:", inventory)
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const batch = firestore.writeBatch(db)

    inventory.forEach((item) => {
      const docRef = firestore.doc(db, "inventory", item.productId.toString())
      batch.set(docRef, item)
    })

    await batch.commit()
    console.log("Inventario guardado correctamente")
    return true
  } catch (error) {
    console.error("Error al guardar inventario:", error)
    return false
  }
}

export const getInventory = async (): Promise<FirebaseInventoryItem[]> => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return []
  }

  try {
    console.log("Obteniendo inventario de Firebase")
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const querySnapshot = await firestore.getDocs(firestore.collection(db, "inventory"))
    const inventory: FirebaseInventoryItem[] = []
    querySnapshot.forEach((doc) => {
      inventory.push(doc.data() as FirebaseInventoryItem)
    })
    console.log("Inventario obtenido:", inventory)
    return inventory
  } catch (error) {
    console.error("Error al obtener inventario:", error)
    return []
  }
}

// Funciones para registros
export const saveRecord = async (record: FirebaseRecord) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return false
  }

  try {
    console.log("Guardando registro en Firebase:", record)
    const db = getFirestore()
    const firestore = getFirestoreModule()

    await firestore.setDoc(firestore.doc(db, "records", record.id.toString()), record)
    console.log("Registro guardado correctamente")
    return true
  } catch (error) {
    console.error("Error al guardar registro:", error)
    return false
  }
}

export const getRecords = async (): Promise<FirebaseRecord[]> => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return []
  }

  try {
    console.log("Obteniendo registros de Firebase")
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const q = firestore.query(firestore.collection(db, "records"), firestore.orderBy("date", "desc"))
    const querySnapshot = await firestore.getDocs(q)
    const records: FirebaseRecord[] = []
    querySnapshot.forEach((doc) => {
      records.push(doc.data() as FirebaseRecord)
    })
    console.log("Registros obtenidos:", records.length)
    return records
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return []
  }
}

// Función para escuchar cambios en tiempo real
export const subscribeToRecords = (callback: (records: FirebaseRecord[]) => void) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible para suscripciones")
    return () => {}
  }

  try {
    console.log("Suscribiéndose a cambios en registros")
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const q = firestore.query(firestore.collection(db, "records"), firestore.orderBy("date", "desc"))
    return firestore.onSnapshot(q, (querySnapshot) => {
      const records: FirebaseRecord[] = []
      querySnapshot.forEach((doc) => {
        records.push(doc.data() as FirebaseRecord)
      })
      console.log("Cambios en registros detectados:", records.length)
      callback(records)
    })
  } catch (error) {
    console.error("Error al suscribirse a registros:", error)
    return () => {}
  }
}

export const subscribeToProducts = (callback: (products: FirebaseProduct[]) => void) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible para suscripciones")
    return () => {}
  }

  try {
    console.log("Suscribiéndose a cambios en productos")
    const db = getFirestore()
    const firestore = getFirestoreModule()

    return firestore.onSnapshot(firestore.collection(db, "products"), (querySnapshot) => {
      const products: FirebaseProduct[] = []
      querySnapshot.forEach((doc) => {
        products.push(doc.data() as FirebaseProduct)
      })
      console.log("Cambios en productos detectados:", products.length)
      callback(products)
    })
  } catch (error) {
    console.error("Error al suscribirse a productos:", error)
    return () => {}
  }
}

export const subscribeToInventory = (callback: (inventory: FirebaseInventoryItem[]) => void) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible para suscripciones")
    return () => {}
  }

  try {
    console.log("Suscribiéndose a cambios en inventario")
    const db = getFirestore()
    const firestore = getFirestoreModule()

    return firestore.onSnapshot(firestore.collection(db, "inventory"), (querySnapshot) => {
      const inventory: FirebaseInventoryItem[] = []
      querySnapshot.forEach((doc) => {
        inventory.push(doc.data() as FirebaseInventoryItem)
      })
      console.log("Cambios en inventario detectados:", inventory.length)
      callback(inventory)
    })
  } catch (error) {
    console.error("Error al suscribirse a inventario:", error)
    return () => {}
  }
}

// Función para crear un Timestamp (para usar en el cliente)
export const createTimestamp = (date: Date) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return date
  }

  try {
    const firestore = getFirestoreModule()
    return firestore.Timestamp.fromDate(date)
  } catch (error) {
    console.error("Error al crear Timestamp:", error)
    return date
  }
}

// Exportar el estado de Firebase
export const getFirebaseStatus = () => {
  return {
    isInitialized: isFirebaseInitialized,
    error: firebaseError,
  }
}
