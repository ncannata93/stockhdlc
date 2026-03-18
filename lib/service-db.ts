import { supabase } from "./supabase"
import type { Service, Hotel, ServicePayment } from "./service-types"

// Función para generar IDs únicos
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Función para obtener servicios
export async function getServices(): Promise<Service[]> {
  try {
    console.log("🔄 Obteniendo servicios...")

    const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error de Supabase al obtener servicios:", error)
      return getServicesFromLocalStorage()
    }

    console.log("✅ Servicios obtenidos de Supabase:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("❌ Error al obtener servicios:", error)
    return getServicesFromLocalStorage()
  }
}

// Función para obtener hoteles
export async function getHotels(): Promise<Hotel[]> {
  try {
    console.log("🔄 Obteniendo hoteles...")

    const { data, error } = await supabase.from("hotels").select("*").order("name", { ascending: true })

    if (error) {
      console.error("❌ Error de Supabase al obtener hoteles:", error)
      return getHotelsFromLocalStorage()
    }

    console.log("✅ Hoteles obtenidos de Supabase:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("❌ Error al obtener hoteles:", error)
    return getHotelsFromLocalStorage()
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

// Función para agregar hotel
export async function addHotel(hotel: { name: string; code?: string }): Promise<Hotel> {
  try {
    console.log("Agregando hotel:", hotel.name)

    const newHotel = {
      id: generateUniqueId(),
      name: hotel.name,
      code: hotel.code || hotel.name.substring(0, 3).toUpperCase(),
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("hotels").insert([newHotel]).select().single()

    if (error) {
      console.error("Error de Supabase al agregar hotel:", error)
      throw error
    }

    console.log("Hotel agregado a Supabase:", data)
    return data
  } catch (error) {
    console.error("Error al agregar hotel:", error)
    throw error
  }
}

// Función para actualizar hotel
export async function updateHotel(id: string, updates: { name?: string; code?: string; active?: boolean }): Promise<Hotel> {
  try {
    console.log("Actualizando hotel:", id)

    const { data, error } = await supabase
      .from("hotels")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error de Supabase al actualizar hotel:", error)
      throw error
    }

    console.log("Hotel actualizado:", data)
    return data
  } catch (error) {
    console.error("Error al actualizar hotel:", error)
    throw error
  }
}

// Función para eliminar hotel
export async function deleteHotel(id: string): Promise<void> {
  try {
    console.log("Eliminando hotel:", id)

    // Verificar si hay servicios asociados
    const { data: services } = await supabase.from("services").select("id").eq("hotel_id", id)
    
    if (services && services.length > 0) {
      throw new Error(`No se puede eliminar el hotel porque tiene ${services.length} servicio(s) asociado(s)`)
    }

    const { error } = await supabase.from("hotels").delete().eq("id", id)

    if (error) {
      console.error("Error de Supabase al eliminar hotel:", error)
      throw error
    }

    console.log("Hotel eliminado")
  } catch (error) {
    console.error("Error al eliminar hotel:", error)
    throw error
  }
}

// Función para agregar servicio
export async function addService(service: Omit<Service, "id" | "created_at">): Promise<Service> {
  try {
    console.log("🔄 Agregando servicio:", service.name)

    const newService: Service = {
      ...service,
      id: generateUniqueId(),
      created_at: new Date().toISOString(),
      active: service.active !== false,
    }

    const { data, error } = await supabase.from("services").insert([newService]).select().single()

    if (error) {
      console.error("❌ Error de Supabase al agregar servicio:", error)
      return addServiceToLocalStorage(newService)
    }

    console.log("✅ Servicio agregado a Supabase:", data)
    return data
  } catch (error) {
    console.error("❌ Error al agregar servicio:", error)
    const newService: Service = {
      ...service,
      id: generateUniqueId(),
      created_at: new Date().toISOString(),
      active: service.active !== false,
    }
    return addServiceToLocalStorage(newService)
  }
}

// Función para actualizar servicio
export async function updateService(id: string, updates: Partial<Service>): Promise<Service> {
  try {
    console.log("🔄 Actualizando servicio:", id)

    const { data, error } = await supabase.from("services").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("❌ Error de Supabase al actualizar servicio:", error)
      return updateServiceInLocalStorage(id, updates)
    }

    console.log("✅ Servicio actualizado en Supabase:", data)
    return data
  } catch (error) {
    console.error("❌ Error al actualizar servicio:", error)
    return updateServiceInLocalStorage(id, updates)
  }
}

// Función para eliminar servicio
export async function deleteService(id: string): Promise<void> {
  try {
    console.log("🔄 Eliminando servicio:", id)

    // Primero eliminar todos los pagos asociados
    const { error: paymentsError } = await supabase.from("service_payments").delete().eq("service_id", id)

    if (paymentsError) {
      console.error("❌ Error al eliminar pagos del servicio:", paymentsError)
    }

    // Luego eliminar el servicio
    const { error } = await supabase.from("services").delete().eq("id", id)

    if (error) {
      console.error("❌ Error de Supabase al eliminar servicio:", error)
      deleteServiceFromLocalStorage(id)
      return
    }

    console.log("✅ Servicio eliminado de Supabase")
  } catch (error) {
    console.error("❌ Error al eliminar servicio:", error)
    deleteServiceFromLocalStorage(id)
  }
}

// Funcion para obtener TODOS los pagos de servicios con paginacion automatica
export async function getServicePayments(hotelId?: string, filters?: any): Promise<ServicePayment[]> {
  try {
    // Obtener todos los pagos usando paginacion
    let allPayments: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: pageData, error: pageError } = await supabase
        .from("service_payments")
        .select("*")
        .range(from, from + pageSize - 1)
        .order("due_date", { ascending: false })

      if (pageError) {
        console.error("Error al obtener pagos:", pageError)
        break
      }

      if (!pageData || pageData.length === 0) {
        hasMore = false
        break
      }

      allPayments = [...allPayments, ...pageData]

      if (pageData.length < pageSize) {
        hasMore = false
      } else {
        from += pageSize
      }
    }

    // Obtener hoteles
    const { data: hotelsData, error: hotelsError } = await supabase.from("hotels").select("*")

    if (hotelsError) {
      console.error("Error al obtener hoteles:", hotelsError)
      return getServicePaymentsFromLocalStorage()
    }

    // Crear mapa de hoteles para busqueda rapida
    const hotelsMap = new Map()
    hotelsData?.forEach((hotel) => {
      hotelsMap.set(hotel.id, hotel.name)
    })

    // Combinar datos
    const transformedData = allPayments.map((payment) => ({
      ...payment,
      hotel_name: hotelsMap.get(payment.hotel_id) || "Hotel no encontrado",
    }))

    // Aplicar filtros si se proporcionan
    let filteredData = transformedData

    if (hotelId) {
      filteredData = filteredData.filter((p) => p.hotel_id === hotelId)
    }

    if (filters) {
      if (filters.month) {
        filteredData = filteredData.filter((p) => p.month === filters.month)
      }
      if (filters.year) {
        filteredData = filteredData.filter((p) => p.year === filters.year)
      }
      if (filters.status) {
        filteredData = filteredData.filter((p) => p.status === filters.status)
      }
    }

    return filteredData
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return getServicePaymentsFromLocalStorage()
  }
}

// Función para agregar pago de servicio
export async function addServicePayment(payment: Omit<ServicePayment, "id" | "created_at">): Promise<ServicePayment> {
  try {
    console.log("🔄 Agregando pago de servicio:", payment)

    // Verificar si ya existe un pago para este servicio/mes/año
    const existingPayment = await checkExistingPayment(payment.service_id, payment.month, payment.year)
    if (existingPayment) {
      console.warn("⚠️ Ya existe un pago para este servicio/mes/año")
      throw new Error("Ya existe un pago para este servicio en este mes/año")
    }

    const newPayment: ServicePayment = {
      ...payment,
      id: generateUniqueId(),
      created_at: new Date().toISOString(),
    }

    console.log("💾 Insertando pago en Supabase:", newPayment)

    const { data, error } = await supabase.from("service_payments").insert([newPayment]).select().single()

    if (error) {
      console.error("❌ Error de Supabase al agregar pago:", error)
      return addServicePaymentToLocalStorage(newPayment)
    }

    console.log("✅ Pago agregado a Supabase:", data)

    // Verificar el conteo total después de agregar
    const { count } = await supabase.from("service_payments").select("*", { count: "exact", head: true })
    console.log("📊 Total de pagos después de agregar:", count)

    return data
  } catch (error) {
    console.error("❌ Error al agregar pago:", error)
    const newPayment: ServicePayment = {
      ...payment,
      id: generateUniqueId(),
      created_at: new Date().toISOString(),
    }
    return addServicePaymentToLocalStorage(newPayment)
  }
}

// Función para verificar si existe un pago
async function checkExistingPayment(serviceId: string, month: number, year: number): Promise<ServicePayment | null> {
  try {
    const { data, error } = await supabase
      .from("service_payments")
      .select("*")
      .eq("service_id", serviceId)
      .eq("month", month)
      .eq("year", year)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking existing payment:", error)
    }

    return data || null
  } catch (error) {
    console.error("Error checking existing payment:", error)
    return null
  }
}

// Función para actualizar pago de servicio
export async function updateServicePayment(id: string, updates: Partial<ServicePayment>): Promise<ServicePayment> {
  try {
    console.log("🔄 Actualizando pago de servicio:", id, updates)

    const { data, error } = await supabase.from("service_payments").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("❌ Error de Supabase al actualizar pago:", error)
      return updateServicePaymentInLocalStorage(id, updates)
    }

    console.log("✅ Pago actualizado en Supabase:", data)

    // Si el pago se marca como "abonado", generar el pago del siguiente mes
    if (updates.status === "abonado") {
      await generateNextMonthPayment(data)
    }

    return data
  } catch (error) {
    console.error("❌ Error al actualizar pago:", error)
    return updateServicePaymentInLocalStorage(id, updates)
  }
}

// Función para marcar pago como pagado
export async function markPaymentAsPaid(id: string, paymentDate: string, invoiceNumber?: string): Promise<void> {
  const updates = {
    status: "abonado" as const,
    payment_date: paymentDate,
    invoice_number: invoiceNumber,
  }

  await updateServicePayment(id, updates)
}

// Función para generar pago del siguiente mes
async function generateNextMonthPayment(currentPayment: ServicePayment): Promise<void> {
  try {
    console.log("🔄 Generando pago del siguiente mes para:", currentPayment.service_id)

    // Calcular el siguiente mes
    let nextMonth = currentPayment.month + 1
    let nextYear = currentPayment.year

    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }

    // Verificar si ya existe un pago para el siguiente mes
    const existingNextPayment = await checkExistingPayment(currentPayment.service_id, nextMonth, nextYear)
    if (existingNextPayment) {
      console.log("✅ Ya existe pago para el siguiente mes")
      return
    }

    // Crear el pago del siguiente mes
    const nextPayment: Omit<ServicePayment, "id" | "created_at"> = {
      service_id: currentPayment.service_id,
      service_name: currentPayment.service_name,
      hotel_id: currentPayment.hotel_id,
      hotel_name: currentPayment.hotel_name,
      amount: currentPayment.amount,
      month: nextMonth,
      year: nextYear,
      due_date: new Date(nextYear, nextMonth - 1, 15).toISOString().split("T")[0], // Día 15 del mes
      status: "pendiente",
      payment_method: currentPayment.payment_method || "efectivo",
      notes: `Generado automáticamente desde ${currentPayment.month}/${currentPayment.year}`,
    }

    await addServicePayment(nextPayment)
    console.log("✅ Pago del siguiente mes generado exitosamente")
  } catch (error) {
    console.error("❌ Error al generar pago del siguiente mes:", error)
  }
}

// Función para eliminar pago de servicio
export async function deleteServicePayment(id: string): Promise<void> {
  try {
    console.log("🔄 Eliminando pago de servicio:", id)

    const { error } = await supabase.from("service_payments").delete().eq("id", id)

    if (error) {
      console.error("❌ Error de Supabase al eliminar pago:", error)
      deleteServicePaymentFromLocalStorage(id)
      return
    }

    console.log("✅ Pago eliminado de Supabase")

    // Verificar el conteo total después de eliminar
    const { count } = await supabase.from("service_payments").select("*", { count: "exact", head: true })
    console.log("📊 Total de pagos después de eliminar:", count)
  } catch (error) {
    console.error("❌ Error al eliminar pago:", error)
    deleteServicePaymentFromLocalStorage(id)
  }
}

// Función para actualizar promedio de servicio
export async function updateServiceAverage(serviceId: string): Promise<void> {
  try {
    console.log("🔄 Actualizando promedio del servicio:", serviceId)

    // Obtener todos los pagos del servicio
    const { data: payments, error } = await supabase
      .from("service_payments")
      .select("amount")
      .eq("service_id", serviceId)
      .eq("status", "abonado")

    if (error) {
      console.error("❌ Error al obtener pagos para promedio:", error)
      return
    }

    if (!payments || payments.length === 0) {
      console.log("No hay pagos abonados para calcular promedio")
      return
    }

    // Calcular promedio
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const average = total / payments.length

    // Actualizar el servicio
    const { error: updateError } = await supabase
      .from("services")
      .update({ average_amount: average })
      .eq("id", serviceId)

    if (updateError) {
      console.error("❌ Error al actualizar promedio:", updateError)
      return
    }

    console.log("✅ Promedio actualizado:", average)
  } catch (error) {
    console.error("❌ Error al actualizar promedio:", error)
  }
}

// Funciones de localStorage como fallback
function getServicesFromLocalStorage(): Service[] {
  try {
    const stored = localStorage.getItem("services")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error al obtener servicios de localStorage:", error)
    return []
  }
}

function getHotelsFromLocalStorage(): Hotel[] {
  try {
    const stored = localStorage.getItem("hotels")
    return stored
      ? JSON.parse(stored)
      : [
          { id: "1", name: "Hotel Costa Rica", address: "Dirección 1", created_at: new Date().toISOString() },
          { id: "2", name: "Hotel Argentina", address: "Dirección 2", created_at: new Date().toISOString() },
          { id: "3", name: "Hotel Cesop", address: "Dirección 3", created_at: new Date().toISOString() },
        ]
  } catch (error) {
    console.error("Error al obtener hoteles de localStorage:", error)
    return []
  }
}

function addServiceToLocalStorage(service: Service): Service {
  try {
    const services = getServicesFromLocalStorage()
    services.push(service)
    localStorage.setItem("services", JSON.stringify(services))
    return service
  } catch (error) {
    console.error("Error al agregar servicio a localStorage:", error)
    return service
  }
}

function updateServiceInLocalStorage(id: string, updates: Partial<Service>): Service {
  try {
    const services = getServicesFromLocalStorage()
    const index = services.findIndex((s) => s.id === id)
    if (index !== -1) {
      services[index] = { ...services[index], ...updates }
      localStorage.setItem("services", JSON.stringify(services))
      return services[index]
    }
    throw new Error("Servicio no encontrado")
  } catch (error) {
    console.error("Error al actualizar servicio en localStorage:", error)
    throw error
  }
}

function deleteServiceFromLocalStorage(id: string): void {
  try {
    const services = getServicesFromLocalStorage()
    const filtered = services.filter((s) => s.id !== id)
    localStorage.setItem("services", JSON.stringify(filtered))

    // También eliminar pagos asociados
    const payments = getServicePaymentsFromLocalStorage()
    const filteredPayments = payments.filter((p) => p.service_id !== id)
    localStorage.setItem("service_payments", JSON.stringify(filteredPayments))
  } catch (error) {
    console.error("Error al eliminar servicio de localStorage:", error)
  }
}

function getServicePaymentsFromLocalStorage(): ServicePayment[] {
  try {
    const stored = localStorage.getItem("service_payments")
    const payments = stored ? JSON.parse(stored) : []

    console.log("📱 Pagos obtenidos de localStorage:", payments.length)

    // Agregar hotel_name a los pagos de localStorage
    const hotels = getHotelsFromLocalStorage()
    return payments.map((payment: any) => {
      const hotel = hotels.find((h) => h.id === payment.hotel_id)
      return {
        ...payment,
        hotel_name: hotel?.name || "Hotel no encontrado",
      }
    })
  } catch (error) {
    console.error("Error al obtener pagos de localStorage:", error)
    return []
  }
}

function addServicePaymentToLocalStorage(payment: ServicePayment): ServicePayment {
  try {
    const payments = getServicePaymentsFromLocalStorage()

    // Verificar duplicados
    const exists = payments.some(
      (p) => p.service_id === payment.service_id && p.month === payment.month && p.year === payment.year,
    )

    if (exists) {
      throw new Error("Ya existe un pago para este servicio en este mes/año")
    }

    payments.push(payment)
    localStorage.setItem("service_payments", JSON.stringify(payments))

    console.log("📱 Pago agregado a localStorage. Total:", payments.length)

    return payment
  } catch (error) {
    console.error("Error al agregar pago a localStorage:", error)
    throw error
  }
}

function updateServicePaymentInLocalStorage(id: string, updates: Partial<ServicePayment>): ServicePayment {
  try {
    const payments = getServicePaymentsFromLocalStorage()
    const index = payments.findIndex((p) => p.id === id)
    if (index !== -1) {
      payments[index] = { ...payments[index], ...updates }
      localStorage.setItem("service_payments", JSON.stringify(payments))

      // Si se marca como abonado, generar siguiente mes
      if (updates.status === "abonado") {
        generateNextMonthPaymentLocalStorage(payments[index])
      }

      return payments[index]
    }
    throw new Error("Pago no encontrado")
  } catch (error) {
    console.error("Error al actualizar pago en localStorage:", error)
    throw error
  }
}

function generateNextMonthPaymentLocalStorage(currentPayment: ServicePayment): void {
  try {
    let nextMonth = currentPayment.month + 1
    let nextYear = currentPayment.year

    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }

    const payments = getServicePaymentsFromLocalStorage()
    const exists = payments.some(
      (p) => p.service_id === currentPayment.service_id && p.month === nextMonth && p.year === nextYear,
    )

    if (!exists) {
      const nextPayment: ServicePayment = {
        id: generateUniqueId(),
        service_id: currentPayment.service_id,
        service_name: currentPayment.service_name,
        hotel_id: currentPayment.hotel_id,
        hotel_name: currentPayment.hotel_name,
        amount: currentPayment.amount,
        month: nextMonth,
        year: nextYear,
        due_date: new Date(nextYear, nextMonth - 1, 15).toISOString().split("T")[0],
        status: "pendiente",
        payment_method: currentPayment.payment_method || "efectivo",
        notes: `Generado automáticamente desde ${currentPayment.month}/${currentPayment.year}`,
        created_at: new Date().toISOString(),
      }

      payments.push(nextPayment)
      localStorage.setItem("service_payments", JSON.stringify(payments))
      console.log("✅ Pago del siguiente mes generado en localStorage")
    }
  } catch (error) {
    console.error("Error al generar siguiente mes en localStorage:", error)
  }
}

function deleteServicePaymentFromLocalStorage(id: string): void {
  try {
    const payments = getServicePaymentsFromLocalStorage()
    const filtered = payments.filter((p) => p.id !== id)
    localStorage.setItem("service_payments", JSON.stringify(filtered))

    console.log("📱 Pago eliminado de localStorage. Total:", filtered.length)
  } catch (error) {
    console.error("Error al eliminar pago de localStorage:", error)
  }
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
