"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Database, RefreshCw, Trash2, Info } from "lucide-react"

export default function EmergencyMode() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  useEffect(() => {
    // Recopilar información de diagnóstico
    const info = {
      userAgent: navigator.userAgent,
      localStorage: {
        supabaseUrl: localStorage.getItem("supabaseUrl") ? "Configurado" : "No configurado",
        supabaseKey: localStorage.getItem("supabaseKey") ? "Configurado" : "No configurado",
        useLocalMode: localStorage.getItem("useLocalMode"),
      },
      indexedDBSupported: "indexedDB" in window,
      timestamp: new Date().toISOString(),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      platform: navigator.platform,
    }
    setDiagnosticInfo(info)
  }, [])

  const startLocalMode = () => {
    localStorage.setItem("useLocalMode", "true")
    window.location.reload()
  }

  const resetConfiguration = () => {
    localStorage.removeItem("supabaseUrl")
    localStorage.removeItem("supabaseKey")
    localStorage.setItem("useLocalMode", "true")
    window.location.reload()
  }

  const clearLocalDatabase = () => {
    try {
      indexedDB.deleteDatabase("hoteles-stock-db")
      alert("Base de datos local eliminada. La página se recargará.")
      window.location.reload()
    } catch (error) {
      alert("Error al eliminar la base de datos local: " + error)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">HOTELES DE LA COSTA</h1>
      <h2 className="text-lg md:text-xl text-gray-600 mb-6">Sistema de Gestión de Stock</h2>

      <Alert className="mb-6 bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
        <AlertDescription className="text-yellow-800">
          <h3 className="text-lg font-medium mb-2">Modo de emergencia activado</h3>
          <p className="mb-2">
            Se ha detectado un problema al cargar la aplicación completa. Estamos en modo de emergencia para permitirte
            acceder a las funciones básicas.
          </p>
          <p>Por favor, intenta una de las siguientes opciones:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Recarga la página (presiona F5 o el botón de recarga del navegador)</li>
            <li>Borra la caché del navegador y vuelve a intentarlo</li>
            <li>Usa el botón "Iniciar en modo local" a continuación</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="bg-blue-50 text-blue-800">
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Iniciar en modo local
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-600 mb-4">
              Usa la aplicación sin conexión a la base de datos remota. Los datos se guardarán solo en este dispositivo.
            </p>
            <Button onClick={startLocalMode} className="w-full bg-blue-600 hover:bg-blue-700">
              Iniciar en modo local
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="bg-green-50 text-green-800">
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5" />
              Reiniciar configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-600 mb-4">
              Borra la configuración de Supabase y reinicia la aplicación en modo local para empezar de nuevo.
            </p>
            <Button onClick={resetConfiguration} className="w-full bg-green-600 hover:bg-green-700">
              Reiniciar configuración
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="bg-red-50 text-red-800">
            <CardTitle className="flex items-center">
              <Trash2 className="mr-2 h-5 w-5" />
              Borrar datos locales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-600 mb-4">
              Elimina la base de datos local y empieza de nuevo. Esto borrará todos los datos guardados en este
              dispositivo.
            </p>
            <Button onClick={clearLocalDatabase} className="w-full bg-red-600 hover:bg-red-700">
              Borrar datos locales
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="bg-purple-50 text-purple-800">
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-600 mb-4">
              Muestra información de diagnóstico que puede ser útil para solucionar problemas.
            </p>
            <Button
              onClick={() => setShowDiagnostic(!showDiagnostic)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {showDiagnostic ? "Ocultar diagnóstico" : "Mostrar diagnóstico"}
            </Button>

            {showDiagnostic && diagnosticInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs font-mono overflow-auto max-h-40">
                <pre>{JSON.stringify(diagnosticInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Si los problemas persisten, contacta al administrador del sistema.</p>
      </div>
    </div>
  )
}
