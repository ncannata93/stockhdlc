"use client"

import { useState, useEffect } from "react"
import { getHotels } from "@/lib/service-db"
import type { Hotel } from "@/lib/service-types"
import { Plus, Building2 } from "lucide-react"

interface PagosHeaderProps {
  onAddPayment: (hotelId?: string) => void
}

export function PagosHeader({ onAddPayment }: PagosHeaderProps) {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [showHotelSelector, setShowHotelSelector] = useState(false)

  useEffect(() => {
    loadHotels()
  }, [])

  const loadHotels = async () => {
    try {
      const hotelsData = await getHotels()
      setHotels(hotelsData)
    } catch (error) {
      console.error("Error al cargar hoteles:", error)
    }
  }

  const handleAddPayment = (hotelId?: string) => {
    if (hotelId) {
      window.location.href = `/servicios?tab=agregar-pago&hotelId=${hotelId}`
    } else {
      window.location.href = "/servicios?tab=agregar-pago"
    }
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Pagos de Servicios</h2>
        <p className="text-sm text-gray-600 mt-1">Gestiona los pagos de servicios por hotel</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative">
          <button
            onClick={() => setShowHotelSelector(!showHotelSelector)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Building2 className="h-4 w-4" />
            Agregar por Hotel
          </button>

          {showHotelSelector && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="py-1">
                {hotels.map((hotel) => (
                  <button
                    key={hotel.id}
                    onClick={() => {
                      handleAddPayment(hotel.id)
                      setShowHotelSelector(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    🏨 {hotel.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => handleAddPayment()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Agregar Pago
        </button>
      </div>
    </div>
  )
}
