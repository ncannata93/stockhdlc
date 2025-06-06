// Datos de hoteles para el sistema
export interface HotelData {
  id: string
  nombre: string
  activo: boolean
  tarifaDiaria: number
  ubicacion?: string
}

export const hoteles: HotelData[] = [
  {
    id: "1",
    nombre: "Argentina",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Centro",
  },
  {
    id: "2",
    nombre: "Monaco",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Norte",
  },
  {
    id: "3",
    nombre: "Mallak",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Sur",
  },
  {
    id: "4",
    nombre: "Colores",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Este",
  },
  {
    id: "5",
    nombre: "San Miguel",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Oeste",
  },
  {
    id: "6",
    nombre: "Tupe",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Centro",
  },
  {
    id: "7",
    nombre: "Stromboli",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Norte",
  },
  {
    id: "8",
    nombre: "Puntarenas",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Costa",
  },
  {
    id: "9",
    nombre: "Barlovento",
    activo: true,
    tarifaDiaria: 50000,
    ubicacion: "Costa",
  },
]

// Función helper para obtener hotel por nombre
export const getHotelByName = (nombre: string): HotelData | undefined => {
  return hoteles.find((hotel) => hotel.nombre.toLowerCase() === nombre.toLowerCase())
}

// Función helper para obtener todos los hoteles activos
export const getHotelesActivos = (): HotelData[] => {
  return hoteles.filter((hotel) => hotel.activo)
}

// Exportar por defecto también por compatibilidad
export default hoteles
