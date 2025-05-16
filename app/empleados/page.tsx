import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function EmpleadosPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f8ff]">
      <div className="w-full max-w-3xl px-4 py-8 space-y-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 rounded-full p-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900">HOTELES DE LA COSTA</h1>
        <h2 className="text-xl text-gray-700">Sistema de Gestión de Empleados</h2>

        <p className="text-gray-600 max-w-2xl mx-auto">
          Bienvenido al sistema de gestión para Hoteles de la Costa. Acceda a los diferentes módulos para administrar la
          información de empleados.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link href="/empleados/historial" className="w-full">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                  <h3 className="text-lg font-medium">Historial</h3>
                  <p className="text-sm text-gray-500 text-center">Consulte el historial de registros de empleados</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/empleados/agregar" className="w-full">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <h3 className="text-lg font-medium">Agregar</h3>
                  <p className="text-sm text-gray-500 text-center">Registre nuevos empleados y asignaciones</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/empleados/calendario" className="w-full">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <h3 className="text-lg font-medium">Calendario</h3>
                  <p className="text-sm text-gray-500 text-center">Visualice las asignaciones en formato calendario</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/empleados/resumen" className="w-full">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <h3 className="text-lg font-medium">Resumen</h3>
                  <p className="text-sm text-gray-500 text-center">Consulte resúmenes de pagos y asignaciones</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8">
          {/* Modificado para redirigir a la página principal */}
          <Link href="/">
            <Button variant="outline">← Volver al inicio</Button>
          </Link>
        </div>

        <footer className="mt-12 text-sm text-gray-500">
          © 2025 Hoteles de la Costa. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
}
