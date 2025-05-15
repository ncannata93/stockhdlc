// Tipos para Firebase
export type FirebaseProduct = {
  id: number
  name: string
  unit: string
  price: number
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

  try {
    // Importar Firebase dinámicamente (solo en el cliente)
    const firebaseApp = await import("firebase/app").catch((error) => {
      console.error("Error al importar firebase/app:", error)
      throw new Error("No se pudo cargar el módulo firebase/app")
    })

    const firebaseFirestore = await import("firebase/firestore").catch((error) => {
      console.error("Error al importar firebase/firestore:", error)
      throw new Error("No se pudo cargar el módulo firebase/firestore")
    })

    // Configuración de Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authDomain: "hoteles-de-la-costa.firebaseapp.com",
      projectId: "hoteles-de-la-costa",
      storageBucket: "hoteles-de-la-costa.appspot.com",
      messagingSenderId: "xxxxxxxxxxxx",
      appId: "1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxx",
    }

    // Inicializar Firebase
    let app
    if (firebaseApp.getApps().length === 0) {
      app = firebaseApp.initializeApp(firebaseConfig)
    } else {
      app = firebaseApp.getApp()
    }

    // Inicializar Firestore
    const db = firebaseFirestore.getFirestore(app)

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
export const saveProducts = async (products: FirebaseProduct[]) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return false
  }

  try {
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const batch = products.map(async (product) => {
      await firestore.setDoc(firestore.doc(db, "products", product.id.toString()), product)
    })
    await Promise.all(batch)
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
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const querySnapshot = await firestore.getDocs(firestore.collection(db, "products"))
    const products: FirebaseProduct[] = []
    querySnapshot.forEach((doc) => {
      products.push(doc.data() as FirebaseProduct)
    })
    return products
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

// Funciones para inventario
export const saveInventory = async (inventory: FirebaseInventoryItem[]) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return false
  }

  try {
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const batch = inventory.map(async (item) => {
      await firestore.setDoc(firestore.doc(db, "inventory", item.productId.toString()), item)
    })
    await Promise.all(batch)
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
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const querySnapshot = await firestore.getDocs(firestore.collection(db, "inventory"))
    const inventory: FirebaseInventoryItem[] = []
    querySnapshot.forEach((doc) => {
      inventory.push(doc.data() as FirebaseInventoryItem)
    })
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
    const db = getFirestore()
    const firestore = getFirestoreModule()

    await firestore.setDoc(firestore.doc(db, "records", record.id.toString()), record)
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
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const q = firestore.query(firestore.collection(db, "records"), firestore.orderBy("date", "desc"))
    const querySnapshot = await firestore.getDocs(q)
    const records: FirebaseRecord[] = []
    querySnapshot.forEach((doc) => {
      records.push(doc.data() as FirebaseRecord)
    })
    return records
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return []
  }
}

// Función para escuchar cambios en tiempo real
export const subscribeToRecords = (callback: (records: FirebaseRecord[]) => void) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return () => {}
  }

  try {
    const db = getFirestore()
    const firestore = getFirestoreModule()

    const q = firestore.query(firestore.collection(db, "records"), firestore.orderBy("date", "desc"))
    return firestore.onSnapshot(q, (querySnapshot) => {
      const records: FirebaseRecord[] = []
      querySnapshot.forEach((doc) => {
        records.push(doc.data() as FirebaseRecord)
      })
      callback(records)
    })
  } catch (error) {
    console.error("Error al suscribirse a registros:", error)
    return () => {}
  }
}

export const subscribeToProducts = (callback: (products: FirebaseProduct[]) => void) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return () => {}
  }

  try {
    const db = getFirestore()
    const firestore = getFirestoreModule()

    return firestore.onSnapshot(firestore.collection(db, "products"), (querySnapshot) => {
      const products: FirebaseProduct[] = []
      querySnapshot.forEach((doc) => {
        products.push(doc.data() as FirebaseProduct)
      })
      callback(products)
    })
  } catch (error) {
    console.error("Error al suscribirse a productos:", error)
    return () => {}
  }
}

export const subscribeToInventory = (callback: (inventory: FirebaseInventoryItem[]) => void) => {
  if (!isFirebaseAvailable()) {
    console.error("Firebase no está disponible")
    return () => {}
  }

  try {
    const db = getFirestore()
    const firestore = getFirestoreModule()

    return firestore.onSnapshot(firestore.collection(db, "inventory"), (querySnapshot) => {
      const inventory: FirebaseInventoryItem[] = []
      querySnapshot.forEach((doc) => {
        inventory.push(doc.data() as FirebaseInventoryItem)
      })
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
