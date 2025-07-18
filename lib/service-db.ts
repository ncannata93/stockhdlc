// lib/service-db.ts

import { createClient } from "@supabase/supabase-js"
import type { ServicePayment, Hotel, Service } from "./service-types"

// Crear cliente de Supabase con verificación de variables de entorno
let supabase: any = null

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log("Cliente de Supabase creado exitosamente")
  } else {
    console.warn("Variables de entorno de Supabase no encontradas, usando localStorage como fallback")
  }
} catch (error) {
  console.error("Error creando cliente de Supabase:", error)
}

// Funciones de localStorage como fallback
const getFromLocalStorage = (key: string) => {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Error leyendo ${key} de localStorage:`, error)
    return []
  }
}

const saveToLocalStorage = (key: string, data: any) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error guardando ${key} en localStorage:`, error)
  }
}

// Función para generar fecha de vencimiento basada en el mes (MISMO MES)
function generateDueDate(month: number, year: number): string {
  // Los servicios vencen el día 10 del MISMO mes
  return `${year}-${month.toString().padStart(2, "0")}-10`
}

// Función para auto-generar pagos mensuales
async function generateMonthlyPayments(service: Service, monthsAhead = 12): Promise<void> {
  try {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const payments: Omit<ServicePayment, "id" | "created_at" | "updated_at">[] = []

    for (let i = 0; i < monthsAhead; i++) {
      const month = ((currentMonth - 1 + i) % 12) + 1
      const year = currentYear + Math.floor((currentMonth - 1 + i) / 12)

      // Verificar si ya existe un pago para este mes/año
      const existingPayments = await getServicePayments(service.hotel_id, { month, year })
      const exists = existingPayments.some((p) => p.service_id === service.id)

      if (!exists) {
        payments.push({
          service_id: service.id,
          service_name: service.name,
          hotel_id: service.hotel_id,
          hotel_name: service.hotel_name || "Hotel no encontrado",
          month,
          year,
          amount: service.average_amount || 0,
          due_date: generateDueDate(month, year), // Ahora vence en el mismo mes
          status: "pendiente",
          notes: "Generado automáticamente",
        })
      }
    }

    // Insertar todos los pagos
    for (const payment of payments) {
      await addServicePayment(payment)
    }

    console.log(`Generados ${payments.length} pagos para el servicio: ${service.name}`)
  } catch (error) {
    console.error("Error generating monthly payments:", error)
  }
}

// Función para verificar y generar pagos faltantes automáticamente
async function checkAndGenerateMissingPayments(): Promise<void> {
  try {
    console.log("Verificando pagos faltantes...")
    const services = await getServices()
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    for (const service of services) {
      // Obtener todos los pagos de este servicio
      const servicePayments = await getServicePayments(service.hotel_id)
      const paymentsForService = servicePayments.filter((p) => p.service_id === service.id)

      if (paymentsForService.length === 0) {
        // Si no hay pagos, generar desde el mes actual
        await generateMonthlyPayments(service, 12)
        continue
      }

      // Encontrar el último mes/año con pago generado
      const lastPayment = paymentsForService.reduce((latest, payment) => {
        const paymentDate = new Date(payment.year, payment.month - 1)
        const latestDate = new Date(latest.year, latest.month - 1)
        return paymentDate > latestDate ? payment : latest
      })

      // Calcular cuántos meses faltan hasta tener al menos 6 meses de buffer
      const lastPaymentDate = new Date(lastPayment.year, lastPayment.month - 1)
      const currentDateForComparison = new Date(currentYear, currentMonth - 1)
      const monthsDiff =
        (lastPaymentDate.getFullYear() - currentDateForComparison.getFullYear()) * 12 +
        (lastPaymentDate.getMonth() - currentDateForComparison.getMonth())

      // Si quedan menos de 3 meses de pagos generados, generar 12 más
      if (monthsDiff < 3) {
        console.log(`Generando pagos adicionales para servicio: ${service.name}`)

        // Generar pagos desde el mes siguiente al último pago
        const nextMonth = lastPayment.month === 12 ? 1 : lastPayment.month + 1
        const nextYear = lastPayment.month === 12 ? lastPayment.year + 1 : lastPayment.year

        await generateMonthlyPaymentsFromDate(service, nextMonth, nextYear, 12)
      }
    }
  } catch (error) {
    console.error("Error verificando pagos faltantes:", error)
  }
}

// Función para generar pagos desde una fecha específica
async function generateMonthlyPaymentsFromDate(
  service: Service,
  startMonth: number,
  startYear: number,
  monthsAhead = 12,
): Promise<void> {
  try {
    const payments: Omit<ServicePayment, "id" | "created_at" | "updated_at">[] = []

    for (let i = 0; i < monthsAhead; i++) {
      const month = ((startMonth - 1 + i) % 12) + 1
      const year = startYear + Math.floor((startMonth - 1 + i) / 12)

      // Verificar si ya existe un pago para este mes/año
      const existingPayments = await getServicePayments(service.hotel_id, { month, year })
      const exists = existingPayments.some((p) => p.service_id === service.id)

      if (!exists) {
        payments.push({
          service_id: service.id,
          service_name: service.name,
          hotel_id: service.hotel_id,
          hotel_name: service.hotel_name || "Hotel no encontrado",
          month,
          year,
          amount: service.average_amount || 0,
          due_date: generateDueDate(month, year), // Ahora vence en el mismo mes
          status: "pendiente",
          notes: "Generado automáticamente",
        })
      }
    }

    // Insertar todos los pagos
    for (const payment of payments) {
      await addServicePayment(payment)
    }
  } catch (error) {
    console.error("Error generating monthly payments from date:", error)
  }
}

// Función para actualizar información de pagos cuando se actualiza un servicio
async function updateServicePaymentsInfo(serviceId: string, updates: Partial<Service>): Promise<void> {
  try {
    console.log(`Actualizando información de pagos para servicio: ${serviceId}`)

    // Obtener todos los pagos de este servicio
    const allPayments = await getServicePaymentsRaw()
    const servicePayments = allPayments.filter((p) => p.service_id === serviceId)

    if (servicePayments.length === 0) {
      console.log("No hay pagos para actualizar")
      return
    }

    // Preparar las actualizaciones para los pagos
    const paymentUpdates: Partial<ServicePayment> = {}

    // Si se actualizó el nombre del servicio
    if (updates.name) {
      paymentUpdates.service_name = updates.name
    }

    // Si se actualizó el hotel
    if (updates.hotel_id && updates.hotel_name) {
      paymentUpdates.hotel_id = updates.hotel_id
      paymentUpdates.hotel_name = updates.hotel_name
    }

    // Si hay actualizaciones que hacer
    if (Object.keys(paymentUpdates).length > 0) {
      console.log(`Actualizando ${servicePayments.length} pagos con:`, paymentUpdates)

      // Actualizar cada pago
      for (const payment of servicePayments) {
        await updateServicePayment(payment.id, paymentUpdates)
      }

      console.log(`Actualizados ${servicePayments.length} pagos del servicio`)
    }
  } catch (error) {
    console.error("Error updating service payments info:", error)
  }
}

// Función para actualizar el promedio mensual basándose en pagos reales
export async function updateServiceAverage(serviceId: string): Promise<void> {
  try {
    console.log(`Actualizando promedio para servicio: ${serviceId}`)

    // Obtener todos los pagos abonados de este servicio
    const allPayments = await getServicePaymentsRaw() // Nueva función sin verificaciones automáticas
    const paidPayments = allPayments.filter((p) => p.service_id === serviceId && p.status === "abonado")

    console.log(
      `Pagos abonados encontrados:`,
      paidPayments.map((p) => ({ month: p.month, year: p.year, amount: p.amount })),
    )

    if (paidPayments.length >= 1) {
      // Actualizar si hay al menos 1 pago (cambiado de 2 a 1)
      const totalAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const newAverage = totalAmount / paidPayments.length

      console.log(`Montos: [${paidPayments.map((p) => p.amount).join(", ")}]`)
      console.log(`Total: ${totalAmount}, Cantidad: ${paidPayments.length}, Promedio: ${newAverage}`)

      console.log(`Nuevo promedio calculado: ${newAverage} (basado en ${paidPayments.length} pagos)`)

      // Actualizar el servicio con el nuevo promedio
      await updateService(serviceId, {
        average_amount: Math.round(newAverage * 100) / 100, // Redondear a 2 decimales
      })

      // Actualizar pagos futuros pendientes con el nuevo promedio
      const futurePayments = allPayments.filter((p) => p.service_id === serviceId && p.status === "pendiente")

      for (const payment of futurePayments) {
        await updateServicePayment(payment.id, {
          amount: Math.round(newAverage * 100) / 100,
        })
      }

      console.log(`Actualizados ${futurePayments.length} pagos futuros con el nuevo promedio`)
    }
  } catch (error) {
    console.error("Error updating service average:", error)
  }
}

// Obtener hoteles
export async function getHotels(): Promise<Hotel[]> {
  console.log("Obteniendo hoteles...")

  if (supabase) {
    try {
      const { data, error } = await supabase.from("hotels").select("*").order("name")

      if (error) {
        console.error("Error de Supabase al obtener hoteles:", error)
        return getFromLocalStorage("hotels")
      }

      console.log("Hoteles obtenidos de Supabase:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Error al obtener hoteles de Supabase:", error)
      return getFromLocalStorage("hotels")
    }
  }

  // Fallback a localStorage
  const hotels = getFromLocalStorage("hotels")
  console.log("Hoteles obtenidos de localStorage:", hotels.length)

  // Si no hay hoteles en localStorage, crear algunos de ejemplo
  if (hotels.length === 0) {
    const defaultHotels = [
      { id: "1", name: "Hotel Costa del Sol", address: "Av. Principal 123", phone: "123-456-7890" },
      { id: "2", name: "Hotel Mar Azul", address: "Calle Marina 456", phone: "098-765-4321" },
      { id: "3", name: "Hotel Vista Hermosa", address: "Boulevard Norte 789", phone: "555-123-4567" },
    ]
    saveToLocalStorage("hotels", defaultHotels)
    return defaultHotels
  }

  return hotels
}

// Función para obtener el nombre del hotel por ID
export async function getHotelNameById(hotelId: string): Promise<string> {
  try {
    const hotels = await getHotels()
    const hotel = hotels.find((h) => h.id === hotelId)
    return hotel ? hotel.name : "Hotel no encontrado"
  } catch (error) {
    console.error("Error getting hotel name:", error)
    return "Hotel no encontrado"
  }
}

// Obtener servicios
export async function getServices(): Promise<Service[]> {
  console.log("Obteniendo servicios...")

  if (supabase) {
    try {
      const { data, error } = await supabase.from("services").select("*").order("name")

      if (error) {
        console.error("Error de Supabase al obtener servicios:", error)
        return getFromLocalStorage("services")
      }

      console.log("Servicios obtenidos de Supabase:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Error al obtener servicios de Supabase:", error)
      return getFromLocalStorage("services")
    }
  }

  // Fallback a localStorage
  const services = getFromLocalStorage("services")
  console.log("Servicios obtenidos de localStorage:", services.length)

  // Si no hay servicios en localStorage, crear algunos de ejemplo
  if (services.length === 0) {
    const defaultServices = [
      { id: "1", name: "Limpieza General", description: "Servicio de limpieza completa", price: 5000 },
      { id: "2", name: "Mantenimiento", description: "Mantenimiento preventivo", price: 8000 },
      { id: "3", name: "Jardinería", description: "Cuidado de jardines y áreas verdes", price: 3000 },
      { id: "4", name: "Seguridad", description: "Servicio de seguridad 24/7", price: 15000 },
    ]
    saveToLocalStorage("services", defaultServices)
    return defaultServices
  }

  return services
}

// Funciones para servicios
export async function addService(service: Omit<Service, "id" | "created_at" | "updated_at">): Promise<Service> {
  try {
    console.log("Intentando guardar servicio:", service)

    if (!supabase) {
      console.warn("Supabase client not available, using localStorage")
      const newService = addServiceToLocalStorage(service)

      // Generar pagos automáticamente después de crear el servicio
      await generateMonthlyPayments(newService, 12)

      return newService
    }

    const { data, error } = await supabase
      .from("services")
      .insert([
        {
          name: service.name,
          description: service.description,
          category: service.category,
          provider: service.provider,
          account_number: service.account_number,
          hotel_id: service.hotel_id,
          notes: service.notes,
          active: service.active,
          average_amount: service.average_amount || 0,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error de Supabase al guardar servicio:", error)
      // Solo usar localStorage como último recurso
      const newService = addServiceToLocalStorage(service)

      // Generar pagos automáticamente después de crear el servicio
      await generateMonthlyPayments(newService, 12)

      return newService
    }

    console.log("Servicio guardado exitosamente en Supabase:", data)

    // Generar pagos automáticamente después de crear el servicio
    await generateMonthlyPayments(data, 12)

    return data
  } catch (error) {
    console.error("Error general al guardar servicio:", error)
    const newService = addServiceToLocalStorage(service)

    // Generar pagos automáticamente después de crear el servicio
    await generateMonthlyPayments(newService, 12)

    return newService
  }
}

function addServiceToLocalStorage(service: Omit<Service, "id" | "created_at" | "updated_at">): Service {
  try {
    const services = getFromLocalStorage("services")

    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    services.push(newService)
    saveToLocalStorage("services", services)
    return newService
  } catch (error) {
    console.error("Error adding service to localStorage:", error)
    throw error
  }
}

export async function updateService(id: string, updates: Partial<Service>): Promise<void> {
  try {
    // Si se está actualizando el hotel_id, actualizar también el hotel_name
    if (updates.hotel_id) {
      const hotelName = await getHotelNameById(updates.hotel_id)
      updates.hotel_name = hotelName
    }

    if (!supabase) {
      console.warn("Supabase client not available, using localStorage")
      updateServiceInLocalStorage(id, updates)
      return
    }

    const { error } = await supabase
      .from("services")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error de Supabase al actualizar servicio:", error)
      updateServiceInLocalStorage(id, updates)
    }

    // Actualizar información en los pagos relacionados
    await updateServicePaymentsInfo(id, updates)
  } catch (error) {
    console.warn("Using localStorage for updating service:", error)
    updateServiceInLocalStorage(id, updates)

    // Actualizar información en los pagos relacionados (también para localStorage)
    await updateServicePaymentsInfo(id, updates)
  }
}

function updateServiceInLocalStorage(id: string, updates: Partial<Service>): void {
  try {
    const services = getFromLocalStorage("services")
    const index = services.findIndex((service) => service.id === id)

    if (index !== -1) {
      services[index] = { ...services[index], ...updates, updated_at: new Date().toISOString() }
      saveToLocalStorage("services", services)
    }
  } catch (error) {
    console.error("Error updating service in localStorage:", error)
    throw error
  }
}

export async function deleteService(id: string): Promise<void> {
  try {
    if (!supabase) {
      console.warn("Supabase client not available, using localStorage")
      deleteServiceFromLocalStorage(id)
      return
    }
    const { error } = await supabase.from("services").update({ active: false }).eq("id", id)

    if (error) {
      console.error("Error de Supabase al eliminar servicio:", error)
      deleteServiceFromLocalStorage(id)
    }
  } catch (error) {
    console.warn("Using localStorage for deleting service:", error)
    deleteServiceFromLocalStorage(id)
  }
}

function deleteServiceFromLocalStorage(id: string): void {
  try {
    const services = getFromLocalStorage("services")
    const filtered = services.filter((service) => service.id !== id)
    saveToLocalStorage("services", filtered)
  } catch (error) {
    console.error("Error deleting service from localStorage:", error)
    throw error
  }
}

// Obtener pagos de servicios
export async function getServicePayments(
  hotelId?: string,
  filters?: {
    month?: number
    year?: number
    status?: string
  },
): Promise<ServicePayment[]> {
  console.log("Obteniendo pagos de servicios...")

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("service_payments")
        .select(`
          *,
          hotels!service_payments_hotel_id_fkey(name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error de Supabase al obtener pagos:", error)
        return getFromLocalStorage("service_payments")
      }

      // Transformar los datos para incluir hotel_name
      const transformedData =
        data?.map((payment) => ({
          ...payment,
          hotel_name: payment.hotels?.name || "Hotel no encontrado",
        })) || []

      console.log("Pagos obtenidos de Supabase:", transformedData.length)
      return transformedData
    } catch (error) {
      console.error("Error al obtener pagos de Supabase:", error)
      return getFromLocalStorage("service_payments")
    }
  }

  // Fallback a localStorage
  const payments = getFromLocalStorage("service_payments")
  const hotels = await getHotels()

  // Agregar nombres de hoteles a los pagos
  const paymentsWithHotelNames = payments.map((payment: any) => {
    const hotel = hotels.find((h) => h.id === payment.hotel_id)
    return {
      ...payment,
      hotel_name: hotel?.name || "Hotel no encontrado",
    }
  })

  console.log("Pagos obtenidos de localStorage:", paymentsWithHotelNames.length)

  // Si no hay pagos, crear algunos de ejemplo para enero y febrero
  if (paymentsWithHotelNames.length === 0) {
    const defaultPayments = [
      {
        id: "1",
        service_id: "1",
        service_name: "Limpieza General",
        hotel_id: "1",
        hotel_name: "Hotel Costa del Sol",
        month: 1,
        year: 2025,
        amount: 5000,
        due_date: "2025-01-31T00:00:00.000Z",
        status: "pendiente",
        created_at: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        service_id: "2",
        service_name: "Mantenimiento",
        hotel_id: "2",
        hotel_name: "Hotel Mar Azul",
        month: 2,
        year: 2025,
        amount: 8000,
        due_date: "2025-02-28T00:00:00.000Z",
        status: "pendiente",
        created_at: "2025-01-15T00:00:00.000Z",
      },
      {
        id: "3",
        service_id: "3",
        service_name: "Jardinería",
        hotel_id: "1",
        hotel_name: "Hotel Costa del Sol",
        month: 1,
        year: 2025,
        amount: 3000,
        due_date: "2025-01-15T00:00:00.000Z",
        status: "abonado",
        payment_date: "2025-01-10T00:00:00.000Z",
        payment_method: "transferencia",
        invoice_number: "001-001-0000123",
        created_at: "2025-01-01T00:00:00.000Z",
      },
    ]
    saveToLocalStorage("service_payments", defaultPayments)
    return defaultPayments
  }

  return paymentsWithHotelNames
}

// Agregar pago de servicio
export async function addServicePayment(payment: Omit<ServicePayment, "id" | "created_at">): Promise<void> {
  console.log("Agregando pago de servicio:", payment)

  if (supabase) {
    try {
      const { error } = await supabase.from("service_payments").insert([
        {
          ...payment,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) {
        console.error("Error de Supabase al agregar pago:", error)
        throw error
      }

      console.log("Pago agregado exitosamente a Supabase")
      return
    } catch (error) {
      console.error("Error al agregar pago a Supabase:", error)
      // Continuar con localStorage como fallback
    }
  }

  // Fallback a localStorage
  const payments = getFromLocalStorage("service_payments")
  const newPayment = {
    ...payment,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  }

  payments.push(newPayment)
  saveToLocalStorage("service_payments", payments)
  console.log("Pago agregado a localStorage")
}

// Actualizar pago de servicio
export async function updateServicePayment(id: string, updates: Partial<ServicePayment>): Promise<void> {
  console.log("Actualizando pago:", id, updates)

  if (supabase) {
    try {
      const { error } = await supabase.from("service_payments").update(updates).eq("id", id)

      if (error) {
        console.error("Error de Supabase al actualizar pago:", error)
        throw error
      }

      console.log("Pago actualizado exitosamente en Supabase")
      return
    } catch (error) {
      console.error("Error al actualizar pago en Supabase:", error)
      // Continuar con localStorage como fallback
    }
  }

  // Fallback a localStorage
  const payments = getFromLocalStorage("service_payments")
  const index = payments.findIndex((p: any) => p.id === id)

  if (index !== -1) {
    payments[index] = { ...payments[index], ...updates }
    saveToLocalStorage("service_payments", payments)
    console.log("Pago actualizado en localStorage")
  }
}

// Eliminar pago de servicio
export async function deleteServicePayment(id: string): Promise<void> {
  console.log("Eliminando pago:", id)

  if (supabase) {
    try {
      const { error } = await supabase.from("service_payments").delete().eq("id", id)

      if (error) {
        console.error("Error de Supabase al eliminar pago:", error)
        throw error
      }

      console.log("Pago eliminado exitosamente de Supabase")
      return
    } catch (error) {
      console.error("Error al eliminar pago de Supabase:", error)
      // Continuar con localStorage como fallback
    }
  }

  // Fallback a localStorage
  const payments = getFromLocalStorage("service_payments")
  const filteredPayments = payments.filter((p: any) => p.id !== id)
  saveToLocalStorage("service_payments", filteredPayments)
  console.log("Pago eliminado de localStorage")
}

// Marcar pago como pagado
export async function markPaymentAsPaid(id: string, paymentDate: string, invoiceNumber?: string): Promise<void> {
  const updates = {
    status: "abonado" as const,
    payment_date: paymentDate,
    invoice_number: invoiceNumber,
  }

  await updateServicePayment(id, updates)
}

// Nueva función para generar pagos manualmente (sin llamadas automáticas)
export async function manuallyGeneratePayments(serviceId: string): Promise<void> {
  try {
    const services = await getServices()
    const service = services.find((s) => s.id === serviceId)
    if (service) {
      await generateMonthlyPayments(service)
    }
  } catch (error) {
    console.error("Error generating payments manually:", error)
  }
}

// Nueva función para verificar pagos manualmente (sin llamadas automáticas)
export async function manuallyCheckMissingPayments(): Promise<void> {
  try {
    await checkAndGenerateMissingPayments()
  } catch (error) {
    console.error("Error checking missing payments manually:", error)
  }
}

// Nueva función para obtener pagos sin verificaciones automáticas
async function getServicePaymentsRaw(): Promise<ServicePayment[]> {
  try {
    if (!supabase) {
      console.warn("Supabase client not available, using localStorage")
      return getFromLocalStorage("service_payments")
    }
    const { data: payments, error } = await supabase.from("service_payments").select("*")

    if (error) {
      return getFromLocalStorage("service_payments")
    }

    return payments || []
  } catch (error) {
    return getFromLocalStorage("service_payments")
  }
}

// Nueva función para generar pagos futuros para un servicio específico
async function generateFuturePaymentsForService(serviceId: string): Promise<void> {
  try {
    console.log(`Generando pagos futuros para servicio: ${serviceId}`)

    // Obtener el servicio
    const services = await getServices()
    const service = services.find((s) => s.id === serviceId)
    if (!service) {
      console.error("Servicio no encontrado:", serviceId)
      return
    }

    // Obtener todos los pagos de este servicio
    const allPayments = await getServicePaymentsRaw()
    const servicePayments = allPayments.filter((p) => p.service_id === serviceId)

    if (servicePayments.length === 0) {
      console.log("No hay pagos existentes para este servicio")
      return
    }

    // Encontrar el último mes/año con pago (abonado o pendiente)
    const lastPayment = servicePayments.reduce((latest, payment) => {
      const paymentDate = new Date(payment.year, payment.month - 1)
      const latestDate = new Date(latest.year, latest.month - 1)
      return paymentDate > latestDate ? payment : latest
    })

    console.log(`Último pago encontrado: ${lastPayment.month}/${lastPayment.year}`)

    // Calcular el promedio de los pagos abonados para usar como monto base
    const paidPayments = servicePayments.filter((p) => p.status === "abonado")
    let averageAmount = service.average_amount || 0

    if (paidPayments.length > 0) {
      const totalAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
      averageAmount = totalAmount / paidPayments.length
      console.log(`Promedio calculado: ${averageAmount} (basado en ${paidPayments.length} pagos)`)
    }

    // Generar pagos desde el mes siguiente al último pago hasta 12 meses adelante
    const startMonth = lastPayment.month === 12 ? 1 : lastPayment.month + 1
    const startYear = lastPayment.month === 12 ? lastPayment.year + 1 : lastPayment.year

    const payments: Omit<ServicePayment, "id" | "created_at" | "updated_at">[] = []

    for (let i = 0; i < 12; i++) {
      const month = ((startMonth - 1 + i) % 12) + 1
      const year = startYear + Math.floor((startMonth - 1 + i) / 12)

      // Verificar si ya existe un pago para este mes/año
      const exists = servicePayments.some((p) => p.month === month && p.year === year)

      if (!exists) {
        payments.push({
          service_id: serviceId,
          service_name: service.name,
          hotel_id: service.hotel_id,
          hotel_name: service.hotel_name || "Hotel no encontrado",
          month,
          year,
          amount: Math.round(averageAmount * 100) / 100, // Redondear a 2 decimales
          due_date: generateDueDate(month, year),
          status: "pendiente",
          notes: "Generado automáticamente después de pago",
        })
      }
    }

    console.log(`Generando ${payments.length} pagos futuros`)

    // Insertar todos los pagos futuros
    for (const payment of payments) {
      try {
        await addServicePaymentDirectly(payment)
      } catch (error) {
        console.error("Error insertando pago futuro:", error)
      }
    }

    console.log(`Generados ${payments.length} pagos futuros para el servicio: ${service.name}`)
  } catch (error) {
    console.error("Error generating future payments for service:", error)
  }
}

// Función auxiliar para insertar pagos directamente sin generar más pagos futuros
async function addServicePaymentDirectly(
  payment: Omit<ServicePayment, "id" | "created_at" | "updated_at">,
): Promise<ServicePayment> {
  try {
    if (!supabase) {
      console.warn("Supabase client not available, using localStorage")
      return addServicePaymentToLocalStorage(payment)
    }
    const { data, error } = await supabase
      .from("service_payments")
      .insert([
        {
          service_id: payment.service_id,
          hotel_id: payment.hotel_id,
          hotel_name: payment.hotel_name,
          service_name: payment.service_name,
          month: payment.month,
          year: payment.year,
          amount: payment.amount,
          due_date: payment.due_date,
          payment_date: payment.payment_date,
          status: payment.status || "pendiente",
          invoice_number: payment.invoice_number,
          payment_method: payment.payment_method,
          notes: payment.notes,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error de Supabase al agregar pago directamente:", error)
      return addServicePaymentToLocalStorage(payment)
    }

    return {
      ...data,
      hotel_name: payment.hotel_name || "Hotel no encontrado",
    }
  } catch (error) {
    console.warn("Using localStorage for adding service payment directly:", error)
    return addServicePaymentToLocalStorage(payment)
  }
}

function addServicePaymentToLocalStorage(
  payment: Omit<ServicePayment, "id" | "created_at" | "updated_at">,
): ServicePayment {
  try {
    const payments = getFromLocalStorage("service_payments")

    const newPayment: ServicePayment = {
      ...payment,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    payments.push(newPayment)
    saveToLocalStorage("service_payments", payments)

    return newPayment
  } catch (error) {
    console.error("Error adding service payment to localStorage:", error)
    throw error
  }
}

// FUNCIONES DE RESERVACIONES (REQUERIDAS PARA COMPATIBILIDAD)
// Estas funciones están deshabilitadas pero son necesarias para evitar errores de importación

export async function getReservations(): Promise<any[]> {
  console.warn("getReservations: Esta función está deshabilitada en el módulo de servicios")
  return []
}

export async function addReservation(reservation: any): Promise<any> {
  console.warn("addReservation: Esta función está deshabilitada en el módulo de servicios")
  return { id: "disabled", ...reservation }
}

export async function deleteReservation(id: string): Promise<void> {
  console.warn("deleteReservation: Esta función está deshabilitada en el módulo de servicios")
}
