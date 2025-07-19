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

// Función para generar fecha de vencimiento basada en el mes (día 10)
function generateDueDate(month: number, year: number): string {
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
          due_date: generateDueDate(month, year),
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

// Función para actualizar el promedio mensual basándose en pagos reales
export async function updateServiceAverage(serviceId: string): Promise<void> {
  try {
    console.log(`Actualizando promedio para servicio: ${serviceId}`)

    // Obtener todos los pagos abonados de este servicio
    const allPayments = await getServicePaymentsRaw()
    const paidPayments = allPayments.filter((p) => p.service_id === serviceId && p.status === "abonado")

    console.log(
      `Pagos abonados encontrados:`,
      paidPayments.map((p) => ({ month: p.month, year: p.year, amount: p.amount })),
    )

    if (paidPayments.length >= 1) {
      // Actualizar si hay al menos 1 pago
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

  return services
}

// Funciones para servicios
export async function addService(service: Omit<Service, "id" | "created_at" | "updated_at">): Promise<Service> {
  try {
    console.log("Intentando guardar servicio:", service)

    if (!supabase) {
      console.warn("Supabase client not available, using localStorage")
      const newService = addServiceToLocalStorage(service)
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
      const newService = addServiceToLocalStorage(service)
      await generateMonthlyPayments(newService, 12)
      return newService
    }

    console.log("Servicio guardado exitosamente en Supabase:", data)
    await generateMonthlyPayments(data, 12)
    return data
  } catch (error) {
    console.error("Error general al guardar servicio:", error)
    const newService = addServiceToLocalStorage(service)
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
  } catch (error) {
    console.warn("Using localStorage for updating service:", error)
    updateServiceInLocalStorage(id, updates)
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
    console.log("Eliminando servicio:", id)

    if (!supabase) {
      console.warn("Supabase client not available, using localStorage")
      deleteServiceFromLocalStorage(id)
      return
    }

    // Primero eliminar todos los pagos relacionados con este servicio
    const { error: paymentsError } = await supabase.from("service_payments").delete().eq("service_id", id)

    if (paymentsError) {
      console.error("Error eliminando pagos del servicio:", paymentsError)
    } else {
      console.log("Pagos del servicio eliminados exitosamente")
    }

    // Luego eliminar el servicio
    const { error: serviceError } = await supabase.from("services").delete().eq("id", id)

    if (serviceError) {
      console.error("Error de Supabase al eliminar servicio:", serviceError)
      deleteServiceFromLocalStorage(id)
      throw serviceError
    }

    console.log("Servicio eliminado exitosamente de Supabase")
  } catch (error) {
    console.error("Error al eliminar servicio:", error)
    deleteServiceFromLocalStorage(id)
    throw error
  }
}

function deleteServiceFromLocalStorage(id: string): void {
  try {
    // Eliminar el servicio
    const services = getFromLocalStorage("services")
    const filtered = services.filter((service) => service.id !== id)
    saveToLocalStorage("services", filtered)

    // Eliminar pagos relacionados
    const payments = getFromLocalStorage("service_payments")
    const filteredPayments = payments.filter((payment: any) => payment.service_id !== id)
    saveToLocalStorage("service_payments", filteredPayments)

    console.log("Servicio y pagos relacionados eliminados de localStorage")
  } catch (error) {
    console.error("Error deleting service from localStorage:", error)
    throw error
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
  console.log("🔄 Actualizando pago:", id, updates)

  if (supabase) {
    try {
      const { error } = await supabase.from("service_payments").update(updates).eq("id", id)

      if (error) {
        console.error("Error de Supabase al actualizar pago:", error)
        throw error
      }

      console.log("✅ Pago actualizado exitosamente en Supabase")

      // Si el pago se marca como abonado, generar el siguiente mes
      if (updates.status === "abonado") {
        console.log("🎯 Pago marcado como abonado - Generando siguiente mes...")

        // Obtener el pago actualizado para generar el siguiente
        const { data: updatedPayment } = await supabase.from("service_payments").select("*").eq("id", id).single()

        if (updatedPayment) {
          await generateNextMonthPayment(updatedPayment)
        }
      }

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
    const oldPayment = payments[index]
    payments[index] = { ...payments[index], ...updates }
    saveToLocalStorage("service_payments", payments)
    console.log("Pago actualizado en localStorage")

    // Para localStorage, simular la generación automática
    if (updates.status === "abonado" && oldPayment.status !== "abonado") {
      console.log("🔄 Simulando generación automática en localStorage...")
      await generateNextMonthPayment(payments[index])
    }
  }
}

// Función para generar el pago del siguiente mes
async function generateNextMonthPayment(payment: any): Promise<void> {
  try {
    console.log("🔄 Generando siguiente mes para:", payment.service_name)

    // Calcular próximo mes
    const nextMonth = payment.month === 12 ? 1 : payment.month + 1
    const nextYear = payment.month === 12 ? payment.year + 1 : payment.year

    // Verificar si ya existe
    const existingPayments = await getServicePaymentsRaw()
    const exists = existingPayments.some(
      (p: any) => p.service_id === payment.service_id && p.month === nextMonth && p.year === nextYear,
    )

    if (exists) {
      console.log("⚠️ El pago del próximo mes ya existe")
      return
    }

    // Crear el nuevo pago
    const newPayment = {
      service_id: payment.service_id,
      service_name: payment.service_name,
      hotel_id: payment.hotel_id,
      hotel_name: payment.hotel_name,
      month: nextMonth,
      year: nextYear,
      amount: payment.amount,
      due_date: generateDueDate(nextMonth, nextYear),
      status: "pendiente",
      notes: `Generado automáticamente después de pago de ${payment.month}/${payment.year}`,
    }

    await addServicePayment(newPayment)
    console.log("🎉 Pago automático generado:", newPayment.service_name, `${nextMonth}/${nextYear}`)
  } catch (error) {
    console.error("Error generando pago automático:", error)
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

// FUNCIONES DE RESERVACIONES (REQUERIDAS PARA COMPATIBILIDAD)
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
