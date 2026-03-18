"use client"

import { useState, useEffect } from "react"
import { getHotels, addHotel, updateHotel, deleteHotel } from "@/lib/service-db"
import type { Hotel } from "@/lib/service-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react"

export function HotelesList() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para modal de agregar/editar
  const [showModal, setShowModal] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const hotelsData = await getHotels()
      setHotels(hotelsData || [])
    } catch {
      setError("Error al cargar los hoteles")
    } finally {
      setLoading(false)
    }
  }

  const handleAddClick = () => {
    setEditingHotel(null)
    setFormData({ name: "", code: "" })
    setShowModal(true)
  }

  const handleEditClick = (hotel: Hotel) => {
    setEditingHotel(hotel)
    setFormData({
      name: hotel.name,
      code: hotel.code || "",
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      if (editingHotel) {
        await updateHotel(editingHotel.id, {
          name: formData.name,
          code: formData.code || formData.name.substring(0, 3).toUpperCase(),
        })
      } else {
        await addHotel({
          name: formData.name,
          code: formData.code || formData.name.substring(0, 3).toUpperCase(),
        })
      }
      setShowModal(false)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al guardar el hotel")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (hotel: Hotel) => {
    if (!window.confirm(`¿Estas seguro de eliminar el hotel "${hotel.name}"?`)) return

    try {
      await deleteHotel(hotel.id)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar el hotel")
    }
  }

  const handleToggleActive = async (hotel: Hotel) => {
    try {
      await updateHotel(hotel.id, { active: !hotel.active })
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al cambiar estado del hotel")
    }
  }

  const filteredHotels = hotels.filter((hotel) =>
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hotel.code && hotel.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando hoteles...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Hoteles</h2>
          <p className="text-sm text-gray-500">{hotels.length} hoteles registrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Recargar
          </button>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Hotel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Busqueda */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar hotel..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de hoteles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHotels.map((hotel) => (
          <Card key={hotel.id} className={`${hotel.active === false ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hotel.active === false ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    <Building2 className={`h-5 w-5 ${hotel.active === false ? 'text-gray-500' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{hotel.name}</h3>
                    {hotel.code && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {hotel.code}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(hotel)}
                    className={`p-1.5 rounded transition-colors ${
                      hotel.active === false
                        ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        : 'text-green-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title={hotel.active === false ? 'Activar hotel' : 'Desactivar hotel'}
                  >
                    {hotel.active === false ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEditClick(hotel)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar hotel"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(hotel)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar hotel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {hotel.active === false ? (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">Inactivo</span>
                ) : (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Activo</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHotels.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No se encontraron hoteles</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-blue-600 hover:underline mt-2"
            >
              Limpiar busqueda
            </button>
          )}
        </div>
      )}

      {/* Modal de agregar/editar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHotel ? "Editar Hotel" : "Agregar Hotel"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Hotel *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Hotel Costa del Sol"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Codigo (opcional)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ej: HCS"
                maxLength={10}
              />
              <p className="text-xs text-gray-500">
                Si no se especifica, se generara automaticamente
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !formData.name.trim()}>
                {saving ? "Guardando..." : editingHotel ? "Guardar Cambios" : "Agregar Hotel"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
