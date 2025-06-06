"use client"

import { useState, useEffect } from "react"

interface Empleado {
  id: number
  nombre: string
  apellido: string
  email: string
  puesto: string
}

const EmpleadosList = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const response = await fetch("/api/empleados")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: Empleado[] = await response.json()
        setEmpleados(data)
        setLoading(false)
      } catch (e: any) {
        setError(e.message)
        setLoading(false)
      }
    }

    fetchEmpleados()
  }, [])

  if (loading) {
    return <div>Cargando empleados...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lista de Empleados</h1>
      <div className="border-b border-gray-200 my-4" />
      <ul>
        {empleados.map((empleado) => (
          <li key={empleado.id} className="mb-2">
            <strong>Nombre:</strong> {empleado.nombre} {empleado.apellido}
            <br />
            <strong>Email:</strong> {empleado.email}
            <br />
            <strong>Puesto:</strong> {empleado.puesto}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EmpleadosList
