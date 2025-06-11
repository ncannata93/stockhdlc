"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Settings, Shield, Key } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona usuarios, permisos y configuraciones del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Gestión de Usuarios */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>Administra usuarios existentes y sus permisos de acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users-management">
              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Gestionar Usuarios
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Crear Usuario */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Crear Usuario
            </CardTitle>
            <CardDescription>Agrega nuevos usuarios al sistema con roles específicos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/create-user">
              <Button className="w-full" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Configuración de Permisos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Matriz de Permisos
            </CardTitle>
            <CardDescription>Visualiza y modifica la matriz de permisos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users-management?tab=permissions">
              <Button className="w-full" variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Ver Permisos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
