"use client"

import type React from "react"

import { useState } from "react"

interface Props {
  onClose: () => void
  onEmpleadoAdded: () => void
}

const AgregarEmpleado = ({ onClose, onEmpleadoAdded }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [puesto, setPuesto] = useState("")
  const [salario, setSalario] = useState("")
  const [fechaContratacion, setFechaContratacion] = useState("")
  const [activo, setActivo] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nuevoEmpleado = {
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      puesto,
      salario: Number.parseFloat(salario),
      fechaContratacion,
      activo,
    }

    try {
      const response = await fetch("/api/empleados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoEmpleado),
      })

      if (response.ok) {
        console.log("Empleado agregado exitosamente")
        onEmpleadoAdded()
        onClose()
      } else {
        console.error("Error al agregar empleado:", response.status)
      }
    } catch (error) {
      console.error("Error al agregar empleado:", error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Agregar Empleado</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">
              Nombre:
            </label>
            <input
              type="text"
              id="nombre"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-gray-700 text-sm font-bold mb-2">
              Apellido:
            </label>
            <input
              type="text"
              id="apellido"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-gray-700 text-sm font-bold mb-2">
              Teléfono:
            </label>
            <input
              type="tel"
              id="telefono"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="direccion" className="block text-gray-700 text-sm font-bold mb-2">
              Dirección:
            </label>
            <input
              type="text"
              id="direccion"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="puesto" className="block text-gray-700 text-sm font-bold mb-2">
              Puesto:
            </label>
            <input
              type="text"
              id="puesto"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="salario" className="block text-gray-700 text-sm font-bold mb-2">
              Salario:
            </label>
            <input
              type="number"
              id="salario"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="fechaContratacion" className="block text-gray-700 text-sm font-bold mb-2">
              Fecha de Contratación:
            </label>
            <input
              type="date"
              id="fechaContratacion"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={fechaContratacion}
              onChange={(e) => setFechaContratacion(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="activo" className="block text-gray-700 text-sm font-bold mb-2">
              Activo:
            </label>
            <input
              type="checkbox"
              id="activo"
              className="rounded border-gray-300"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AgregarEmpleado
