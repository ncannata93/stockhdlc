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
    let query = supabase.from("services").select("*").eq("active", true)

    if (hotelId) {
      query = query.eq("hotel_id", hotelId)
    }

    const { data: services, error } = await query.order("name")

    if (error) {
      // Fallback a localStorage
      return getServicesFromLocalStorage(hotelId)
    }

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
    console.warn("Using localStorage for services:", error)
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
          hotel_name: hotelName, // Guardar el nombre del hotel
          notes: service.notes,
          active: service.active,
          average_amount: service.average_amount || 0,
        },
      ])
      .select()
      .single()

    if (error) {
      // Fallback a localStorage
      const newService = addServiceToLocalStorage(service)
      // Generar pagos automáticamente
      await generateMonthlyPayments(newService)
      return newService
    }

    // Asegurarse de que el servicio tenga el nombre del hotel
    const serviceWithHotel = {
      ...data,
      hotel_name: hotelName,
    }

    // Generar pagos automáticamente para Supabase
    await generateMonthlyPayments(serviceWithHotel)
    return serviceWithHotel
  } catch (error) {
    console.warn("Using localStorage for adding service:", error)
    const newService = addServiceToLocalStorage(service)
    await generateMonthlyPayments(newService)
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
    await updateServicePayment(id, {
      status: "abonado",
      payment_date: paymentDate,
      invoice_number: invoiceNumber,
    })
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

// Funciones para reservaciones
export async function getReservations(
  hotelId?: string,
  filters?: {
    status?: string
    date?: string
  },
): Promise<any[]> {
  try {
    let query = supabase.from("reservations").select("*")

    if (hotelId) {
      query = query.eq("hotel_id", hotelId)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.date) {
      query = query.eq("date", filters.date)
    }

    const { data: reservations, error } = await query.order("created_at", { ascending: false })

    if (error) {
      // Fallback a localStorage
      return getReservationsFromLocalStorage(hotelId, filters)
    }

    // Obtener información de hoteles
    const hotels = await getHotels()

    // Combinar los datos
    const reservationsWithDetails = (reservations || []).map((reservation) => {
      const hotel = hotels.find((h) => h.id === reservation.hotel_id)
      return {
        ...reservation,
        hotel_name: hotel?.name || "Hotel no encontrado",
      }
    })

    return reservationsWithDetails
  } catch (error) {
    console.warn("Using localStorage for reservations:", error)
    return getReservationsFromLocalStorage(hotelId, filters)
  }
}

function getReservationsFromLocalStorage(
  hotelId?: string,
  filters?: {
    status?: string
    date?: string
  },
): any[] {
  try {
    const stored = localStorage.getItem("hotel-reservations")
    let reservations = stored ? JSON.parse(stored) : []

    // Asegurarse de que cada reservación tenga un hotel_name
    reservations = reservations.map((reservation: any) => {
      if (!reservation.hotel_name) {
        const hotel = DEFAULT_HOTELS.find((h) => h.id === reservation.hotel_id)
        return {
          ...reservation,
          hotel_name: hotel ? hotel.name : "Hotel no encontrado",
        }
      }
      return reservation
    })

    if (hotelId) {
      reservations = reservations.filter((reservation: any) => reservation.hotel_id === hotelId)
    }

    if (filters?.status) {
      reservations = reservations.filter((reservation: any) => reservation.status === filters.status)
    }

    if (filters?.date) {
      reservations = reservations.filter((reservation: any) => reservation.date === filters.date)
    }

    return reservations
  } catch (error) {
    console.error("Error loading reservations from localStorage:", error)
    return []
  }
}

export async function addReservation(reservation: any): Promise<any> {
  try {
    // Obtener el nombre del hotel
    const hotelName = await getHotelNameById(reservation.hotel_id)

    const { data, error } = await supabase
      .from("reservations")
      .insert([
        {
          ...reservation,
          hotel_name: hotelName,
        },
      ])
      .select()
      .single()

    if (error) {
      return addReservationToLocalStorage(reservation)
    }

    return {
      ...data,
      hotel_name: hotelName,
    }
  } catch (error) {
    console.warn("Using localStorage for adding reservation:", error)
    return addReservationToLocalStorage(reservation)
  }
}

function addReservationToLocalStorage(reservation: any): any {
  try {
    const reservations = getReservationsFromLocalStorage()

    // Obtener el nombre del hotel
    const hotel = DEFAULT_HOTELS.find((h) => h.id === reservation.hotel_id)
    const hotelName = hotel ? hotel.name : "Hotel no encontrado"

    const newReservation = {
      ...reservation,
      id: Date.now().toString(),
      hotel_name: hotelName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    reservations.push(newReservation)
    localStorage.setItem("hotel-reservations", JSON.stringify(reservations))
    return newReservation
  } catch (error) {
    console.error("Error adding reservation to localStorage:", error)
    throw error
  }
}

export async function deleteReservation(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("reservations").delete().eq("id", id)

    if (error) {
      deleteReservationFromLocalStorage(id)
    }
  } catch (error) {
    console.warn("Using localStorage for deleting reservation:", error)
    deleteReservationFromLocalStorage(id)
  }
}

function deleteReservationFromLocalStorage(id: string): void {
  try {
    const reservations = getReservationsFromLocalStorage()
    const filtered = reservations.filter((reservation: any) => reservation.id !== id)
    localStorage.setItem("hotel-reservations", JSON.stringify(filtered))
  } catch (error) {
    console.error("Error deleting reservation from localStorage:", error)
    throw error
  }
}
