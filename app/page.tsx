import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { UserNav } from "@/components/user-nav"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f8ff]">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-end px-4">
          <UserNav />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
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
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">HOTELES DE LA COSTA</h1>
          <h2 className="text-xl text-gray-700">Sistema de Gestión</h2>

          <p className="text-gray-600 max-w-2xl mx-auto">
            Bienvenido al sistema de gestión para Hoteles de la Costa. Acceda a los diferentes módulos para administrar
            su inventario y personal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Link href="/stock" className="w-full">
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
                      <path d="M20 9v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" />
                      <path d="M9 22V12h6v10" />
                      <path d="M2 10.6L12 2l10 8.6" />
                    </svg>
                    <h3 className="text-lg font-medium">Gestión de Stock</h3>
                    <p className="text-sm text-gray-500 text-center">Administre el inventario y stock de los hoteles</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/empleados" className="w-full">
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h3 className="text-lg font-medium">Gestión de Empleados</h3>
                    <p className="text-sm text-gray-500 text-center">
                      Administre la información y asignaciones de empleados
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <footer className="mt-12 text-sm text-gray-500">
            © 2025 Hoteles de la Costa. Todos los derechos reservados.
          </footer>
        </div>
      </div>
    </div>
  )
}
