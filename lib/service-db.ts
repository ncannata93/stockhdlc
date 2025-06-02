// lib/service-db.ts

// This file will contain functions related to managing services in the database.
// Since there was no existing code, this is a new file.
// The update instructions specify removing reservation-related functions.
// Therefore, this file will only contain service-related functions.

import { createClient } from "@supabase/supabase-js"
import type { Service, ServicePayment, Hotel } from "./service-types"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Datos de hoteles por defecto
const DEFAULT_HOTELS: Hotel[] = [
  { id: "1", name: "Jaguel", code: "JAG", active: true },
  { id: "2", name: "Monaco", code: "MON", active: true },
  { id: "3", name: "Mallak", code: "MAL", active: true },
  { id: "4", name: "Argentina", code: "ARG", active: true },
  { id: "5", name: "Falkner", code: "FAL", active: true },
  { id: "6", name: "Stromboli", code: "STR", active: true },
  { id: "7", name: "San Miguel", code: "SMI", active: true },
  { id: "8", name: "Colores", code: "COL", active: true },
  { id: "9", name: "Puntarenas", code: "PUN", active: true },
  { id: "10", name: "Tupe", code: "TUP", active: true },
  { id: "11", name: "Munich", code: "MUN", active: true },
  { id: "12", name: "Tiburones", code: "TIB", active: true },
  { id: "13", name: "Barlovento", code: "BAR", active: true },
  { id: "14", name: "Carama", code: "CAR", active: true },
]

// Función para generar fecha de vencimiento basada en el mes
function generateDueDate(month: number, year: number): string {
  // Generalmente los servicios vencen el día 10 del mes siguiente
  const dueMonth = month === 12 ? 1 : month + 1
  const dueYear = month === 12 ? year + 1 : year
  return `${dueYear}-${dueMonth.toString().padStart(2, "0")}-10`
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
  } catch (error) {
    console.error("Error generating monthly payments from date:", error)
  }
}

// Función para actualizar el promedio mensual basándose en pagos reales
async function updateServiceAverage(serviceId: string): Promise<void> {
  try {
    console.log(`Actualizando promedio para servicio: ${serviceId}`)

    // Obtener todos los pagos abonados de este servicio
    const allPayments = await getServicePaymentsRaw() // Nueva función sin verificaciones automáticas
    const paidPayments = allPayments.filter((p) => p.service_id === serviceId && p.status === "abonado" && p.amount > 0)

    if (paidPayments.length >= 1) {
      // Actualizar si hay al menos 1 pago (cambiado de 2 a 1)
      const totalAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const newAverage = totalAmount / paidPayments.length

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

// Funciones para hoteles
export async function getHotels(): Promise<Hotel[]> {
  try {
    const { data, error } = await supabase.from("hotels").select("*").order("name")

    if (error) {
      console.warn("Using default hotels (Supabase not available):", error.message)
      return DEFAULT_HOTELS
    }
    return data || DEFAULT_HOTELS
  } catch (error) {
    console.warn("Using default hotels (fallback):", error)
    return DEFAULT_HOTELS
  }
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

// Funciones para servicios
export async function getServices(hotelId?: string): Promise<Service[]> {
  try {
    console.log("Obteniendo servicios de Supabase...")
    let query = supabase.from("services").select("*").eq("active", true)

    if (hotelId) {
      query = query.eq("hotel_id", hotelId)
    }

    const { data: services, error } = await query.order("name")

    if (error) {
      console.error("Error al obtener servicios de Supabase:", error)
      return getServicesFromLocalStorage(hotelId)
    }

    console.log("Servicios obtenidos de Supabase:", services?.length || 0)

    // Obtener información de hoteles
    const hotels = await getHotels()

    // Combinar los datos
    const servicesWithHotel = await Promise.all(
      (services || []).map(async (service) => {
        const hotel = hotels.find((h) => h.id === service.hotel_id)
        return {
          ...service,
          hotel_name: hotel ? hotel.name : await getHotelNameById(service.hotel_id),
        }
      }),
    )

    return servicesWithHotel
  } catch (error) {
    console.error("Error general al obtener servicios:", error)
    return getServicesFromLocalStorage(hotelId)
  }
}

function getServicesFromLocalStorage(hotelId?: string): Service[] {
  try {
    const stored = localStorage.getItem("hotel-services")
    let services = stored ? JSON.parse(stored) : []

    // Asegurarse de que cada servicio tenga un hotel_name
    services = services.map((service: Service) => {
      if (!service.hotel_name) {
        const hotel = DEFAULT_HOTELS.find((h) => h.id === service.hotel_id)
        return {
          ...service,
          hotel_name: hotel ? hotel.name : "Hotel no encontrado",
        }
      }
      return service
    })

    if (hotelId) {
      return services.filter((service: Service) => service.hotel_id === hotelId)
    }

    return services
  } catch (error) {
    console.error("Error loading services from localStorage:", error)
    return []
  }
}

export async function addService(service: Omit<Service, "id" | "created_at" | "updated_at">): Promise<Service> {
  try {
    // Obtener el nombre del hotel antes de insertar
    const hotelName = await getHotelNameById(service.hotel_id)

    console.log("Intentando guardar servicio en Supabase:", { ...service, hotel_name: hotelName })

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
          hotel_name: hotelName,
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
      return newService
    }

    console.log("Servicio guardado exitosamente en Supabase:", data)

    // Asegurarse de que el servicio tenga el nombre del hotel
    const serviceWithHotel = {
      ...data,
      hotel_name: hotelName,
    }

    return serviceWithHotel
  } catch (error) {
    console.error("Error general al guardar servicio:", error)
    const newService = addServiceToLocalStorage(service)
    return newService
  }
}

function addServiceToLocalStorage(service: Omit<Service, "id" | "created_at" | "updated_at">): Service {
  try {
    const services = getServicesFromLocalStorage()

    // Obtener el nombre del hotel
    const hotel = DEFAULT_HOTELS.find((h) => h.id === service.hotel_id)
    const hotelName = hotel ? hotel.name : "Hotel no encontrado"

    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      hotel_name: hotelName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    services.push(newService)
    localStorage.setItem("hotel-services", JSON.stringify(services))
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

    const { error } = await supabase
      .from("services")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      updateServiceInLocalStorage(id, updates)
    }
  } catch (error) {
    console.warn("Using localStorage for updating service:", error)
    updateServiceInLocalStorage(id, updates)
  }
}

function updateServiceInLocalStorage(id: string, updates: Partial<Service>): void {
  try {
    const services = getServicesFromLocalStorage()
    const index = services.findIndex((service) => service.id === id)

    // Si se está actualizando el hotel_id, actualizar también el hotel_name
    if (updates.hotel_id) {
      const hotel = DEFAULT_HOTELS.find((h) => h.id === updates.hotel_id)
      updates.hotel_name = hotel ? hotel.name : "Hotel no encontrado"
    }

    if (index !== -1) {
      services[index] = { ...services[index], ...updates, updated_at: new Date().toISOString() }
      localStorage.setItem("hotel-services", JSON.stringify(services))
    }
  } catch (error) {
    console.error("Error updating service in localStorage:", error)
    throw error
  }
}

export async function deleteService(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("services").update({ active: false }).eq("id", id)

    if (error) {
      deleteServiceFromLocalStorage(id)
    }
  } catch (error) {
    console.warn("Using localStorage for deleting service:", error)
    deleteServiceFromLocalStorage(id)
  }
}

function deleteServiceFromLocalStorage(id: string): void {
  try {
    const services = getServicesFromLocalStorage()
    const filtered = services.filter((service) => service.id !== id)
    localStorage.setItem("hotel-services", JSON.stringify(filtered))
  } catch (error) {
    console.error("Error deleting service from localStorage:", error)
    throw error
  }
}

// Funciones para pagos de servicios
export async function getServicePayments(
  hotelId?: string,
  filters?: {
    month?: number
    year?: number
    status?: string
  },
): Promise<ServicePayment[]> {
  try {
    let query = supabase.from("service_payments").select("*")

    if (hotelId) {
      query = query.eq("hotel_id", hotelId)
    }

    if (filters?.month) {
      query = query.eq("month", filters.month)
    }

    if (filters?.year) {
      query = query.eq("year", filters.year)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    const { data: payments, error } = await query.order("due_date", { ascending: false })

    if (error) {
      // Fallback a localStorage
      return getServicePaymentsFromLocalStorage(hotelId, filters)
    }

    // Obtener información de servicios y hoteles
    const services = await getServices()
    const hotels = await getHotels()

    // Combinar los datos
    const paymentsWithDetails = await Promise.all(
      (payments || []).map(async (payment) => {
        const service = services.find((s) => s.id === payment.service_id)
        const hotel = hotels.find((h) => h.id === payment.hotel_id)

        // Si no tiene hotel_name, obtenerlo
        let hotelName = payment.hotel_name
        if (!hotelName) {
          hotelName = hotel ? hotel.name : await getHotelNameById(payment.hotel_id)
        }

        return {
          ...payment,
          service_name: service?.name || payment.service_name || "Servicio no encontrado",
          hotel_name: hotelName,
        }
      }),
    )

    return paymentsWithDetails
  } catch (error) {
    console.warn("Using localStorage for service payments:", error)
    return getServicePaymentsFromLocalStorage(hotelId, filters)
  }
}

function getServicePaymentsFromLocalStorage(
  hotelId?: string,
  filters?: {
    month?: number
    year?: number
    status?: string
  },
): ServicePayment[] {
  try {
    const stored = localStorage.getItem("hotel-service-payments")
    let payments = stored ? JSON.parse(stored) : []

    // Asegurarse de que cada pago tenga un hotel_name
    payments = payments.map((payment: ServicePayment) => {
      if (!payment.hotel_name) {
        const hotel = DEFAULT_HOTELS.find((h) => h.id === payment.hotel_id)
        return {
          ...payment,
          hotel_name: hotel ? hotel.name : "Hotel no encontrado",
        }
      }
      return payment
    })

    if (hotelId) {
      payments = payments.filter((payment: ServicePayment) => payment.hotel_id === hotelId)
    }

    if (filters?.month) {
      payments = payments.filter((payment: ServicePayment) => payment.month === filters.month)
    }

    if (filters?.year) {
      payments = payments.filter((payment: ServicePayment) => payment.year === filters.year)
    }

    if (filters?.status) {
      payments = payments.filter((payment: ServicePayment) => payment.status === filters.status)
    }

    return payments
  } catch (error) {
    console.error("Error loading service payments from localStorage:", error)
    return []
  }
}

export async function addServicePayment(
  payment: Omit<ServicePayment, "id" | "created_at" | "updated_at">,
): Promise<ServicePayment> {
  try {
    // Obtener el nombre del servicio
    const services = await getServices()
    const service = services.find((s) => s.id === payment.service_id)

    // Obtener el nombre del hotel si no está presente
    let hotelName = payment.hotel_name
    if (!hotelName) {
      hotelName = await getHotelNameById(payment.hotel_id)
    }

    const { data, error } = await supabase
      .from("service_payments")
      .insert([
        {
          service_id: payment.service_id,
          hotel_id: payment.hotel_id,
          hotel_name: hotelName,
          service_name: service?.name || payment.service_name || "Servicio",
          month: payment.month,
          year: payment.year,
          amount: payment.amount,
          due_date: payment.due_date,
          payment_date: payment.payment_date,
          status: payment.status || "pendiente",
          invoice_number: payment.invoice_number,
          notes: payment.notes,
        },
      ])
      .select()
      .single()

    if (error) {
      return addServicePaymentToLocalStorage(payment)
    }

    // Asegurarse de que el pago tenga el nombre del hotel
    return {
      ...data,
      hotel_name: hotelName,
    }
  } catch (error) {
    console.warn("Using localStorage for adding service payment:", error)
    return addServicePaymentToLocalStorage(payment)
  }
}

function addServicePaymentToLocalStorage(
  payment: Omit<ServicePayment, "id" | "created_at" | "updated_at">,
): ServicePayment {
  try {
    const payments = getServicePaymentsFromLocalStorage()

    // Obtener el nombre del hotel si no está presente
    let hotelName = payment.hotel_name
    if (!hotelName) {
      const hotel = DEFAULT_HOTELS.find((h) => h.id === payment.hotel_id)
      hotelName = hotel ? hotel.name : "Hotel no encontrado"
    }

    const newPayment: ServicePayment = {
      ...payment,
      id: Date.now().toString(),
      hotel_name: hotelName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    payments.push(newPayment)
    localStorage.setItem("hotel-service-payments", JSON.stringify(payments))
    return newPayment
  } catch (error) {
    console.error("Error adding service payment to localStorage:", error)
    throw error
  }
}

export async function updateServicePayment(id: string, updates: Partial<ServicePayment>): Promise<void> {
  try {
    // Si se está actualizando el hotel_id, actualizar también el hotel_name
    if (updates.hotel_id) {
      const hotelName = await getHotelNameById(updates.hotel_id)
      updates.hotel_name = hotelName
    }

    const { error } = await supabase
      .from("service_payments")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      updateServicePaymentInLocalStorage(id, updates)
    }
  } catch (error) {
    console.warn("Using localStorage for updating service payment:", error)
    updateServicePaymentInLocalStorage(id, updates)
  }
}

function updateServicePaymentInLocalStorage(id: string, updates: Partial<ServicePayment>): void {
  try {
    const payments = getServicePaymentsFromLocalStorage()
    const index = payments.findIndex((payment) => payment.id === id)

    // Si se está actualizando el hotel_id, actualizar también el hotel_name
    if (updates.hotel_id) {
      const hotel = DEFAULT_HOTELS.find((h) => h.id === updates.hotel_id)
      updates.hotel_name = hotel ? hotel.name : "Hotel no encontrado"
    }

    if (index !== -1) {
      payments[index] = { ...payments[index], ...updates, updated_at: new Date().toISOString() }
      localStorage.setItem("hotel-service-payments", JSON.stringify(payments))
    }
  } catch (error) {
    console.error("Error updating service payment in localStorage:", error)
    throw error
  }
}

export async function deleteServicePayment(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("service_payments").delete().eq("id", id)

    if (error) {
      deleteServicePaymentFromLocalStorage(id)
    }
  } catch (error) {
    console.warn("Using localStorage for deleting service payment:", error)
    deleteServicePaymentFromLocalStorage(id)
  }
}

function deleteServicePaymentFromLocalStorage(id: string): void {
  try {
    const payments = getServicePaymentsFromLocalStorage()
    const filtered = payments.filter((payment) => payment.id !== id)
    localStorage.setItem("hotel-service-payments", JSON.stringify(filtered))
  } catch (error) {
    console.error("Error deleting service payment from localStorage:", error)
    throw error
  }
}

export async function markPaymentAsPaid(id: string, paymentDate: string, invoiceNumber?: string): Promise<void> {
  try {
    // Obtener el pago antes de actualizarlo para saber el serviceId
    const payment = await getServicePaymentById(id)

    await updateServicePayment(id, {
      status: "abonado",
      payment_date: paymentDate,
      invoice_number: invoiceNumber,
    })

    // Actualizar el promedio del servicio automáticamente
    if (payment?.service_id) {
      await updateServiceAverage(payment.service_id)
    }
  } catch (error) {
    console.error("Error marking payment as paid:", error)
    throw error
  }
}

// Nueva función para obtener un pago específico por ID
export async function getServicePaymentById(id: string): Promise<ServicePayment | null> {
  try {
    const { data, error } = await supabase.from("service_payments").select("*").eq("id", id).single()

    if (error) {
      // Fallback a localStorage
      return getServicePaymentByIdFromLocalStorage(id)
    }

    // Obtener información de hoteles si no tiene hotel_name
    let hotelName = data.hotel_name
    if (!hotelName) {
      hotelName = await getHotelNameById(data.hotel_id)
    }

    return {
      ...data,
      hotel_name: hotelName,
    }
  } catch (error) {
    console.warn("Using localStorage for getting payment by ID:", error)
    return getServicePaymentByIdFromLocalStorage(id)
  }
}

function getServicePaymentByIdFromLocalStorage(id: string): ServicePayment | null {
  try {
    const payments = getServicePaymentsFromLocalStorage()
    const payment = payments.find((p: ServicePayment) => p.id === id)

    if (payment && !payment.hotel_name) {
      const hotel = DEFAULT_HOTELS.find((h) => h.id === payment.hotel_id)
      return {
        ...payment,
        hotel_name: hotel ? hotel.name : "Hotel no encontrado",
      }
    }

    return payment || null
  } catch (error) {
    console.error("Error getting payment by ID from localStorage:", error)
    return null
  }
}

// Estas funciones son necesarias para la compatibilidad con el código existente
// pero no implementan la funcionalidad de reservaciones
export async function getReservations(): Promise<any[]> {
  console.warn("getReservations: Esta función está deshabilitada")
  return []
}

export async function addReservation(): Promise<any> {
  console.warn("addReservation: Esta función está deshabilitada")
  return {}
}

export async function deleteReservation(): Promise<void> {
  console.warn("deleteReservation: Esta función está deshabilitada")
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
    const { data: payments, error } = await supabase.from("service_payments").select("*")

    if (error) {
      return getServicePaymentsFromLocalStorage()
    }

    return payments || []
  } catch (error) {
    return getServicePaymentsFromLocalStorage()
  }
}
