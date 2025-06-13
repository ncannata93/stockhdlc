"use client"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Hoteles Costa - Sistema de Gestión</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Módulo de Stock</h2>
            <p className="mb-4">Gestión de inventario y productos</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">Acceder</button>
          </div>

          <div className="border rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Módulo de Empleados</h2>
            <p className="mb-4">Gestión de personal y horarios</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">Acceder</button>
          </div>

          <div className="border rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Módulo de Servicios</h2>
            <p className="mb-4">Gestión de servicios y reservaciones</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">Acceder</button>
          </div>
        </div>
      </div>
    </main>
  )
}
