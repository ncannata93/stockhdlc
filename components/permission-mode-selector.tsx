"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Cloud, HardDrive, Wifi, WifiOff, Settings } from "lucide-react"

type PermissionMode = "local" | "cloud"

export default function PermissionModeSelector() {
  const [mode, setMode] = useState<PermissionMode>("local")
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Detectar estado de conexión
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Cargar modo guardado
    const savedMode = localStorage.getItem("permission_mode") as PermissionMode
    if (savedMode) {
      setMode(savedMode)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleModeChange = (newMode: PermissionMode) => {
    setMode(newMode)
    localStorage.setItem("permission_mode", newMode)

    // Recargar página para aplicar cambios
    window.location.reload()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Permisos
        </CardTitle>
        <CardDescription>Elige cómo se almacenan y sincronizan los permisos de usuario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado de Conexión */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            <span className="text-sm font-medium">Estado: {isOnline ? "En línea" : "Sin conexión"}</span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>{isOnline ? "Conectado" : "Desconectado"}</Badge>
        </div>

        {/* Selector de Modo */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Modo de Almacenamiento</Label>

          {/* Modo Local */}
          <div
            className={`p-4 border rounded-lg ${mode === "local" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                <span className="font-medium">Local (Navegador)</span>
              </div>
              <Switch checked={mode === "local"} onCheckedChange={() => handleModeChange("local")} />
            </div>
            <p className="text-sm text-gray-600 mb-2">Los permisos se guardan en este navegador únicamente</p>
            <div className="text-xs space-y-1">
              <div className="text-green-600">✓ Rápido e inmediato</div>
              <div className="text-green-600">✓ Funciona sin internet</div>
              <div className="text-red-600">✗ Solo en este dispositivo</div>
              <div className="text-red-600">✗ Se puede perder al limpiar caché</div>
            </div>
          </div>

          {/* Modo Nube */}
          <div
            className={`p-4 border rounded-lg ${mode === "cloud" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                <span className="font-medium">Nube (Supabase)</span>
              </div>
              <Switch
                checked={mode === "cloud"}
                onCheckedChange={() => handleModeChange("cloud")}
                disabled={!isOnline}
              />
            </div>
            <p className="text-sm text-gray-600 mb-2">Los permisos se sincronizan en todos los dispositivos</p>
            <div className="text-xs space-y-1">
              <div className="text-green-600">✓ Sincronización entre dispositivos</div>
              <div className="text-green-600">✓ Respaldo automático</div>
              <div className="text-green-600">✓ Historial de cambios</div>
              <div className="text-red-600">✗ Requiere conexión a internet</div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {!isOnline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Sin conexión a internet. El modo nube no está disponible. Los cambios se guardarán localmente hasta que se
              restablezca la conexión.
            </AlertDescription>
          </Alert>
        )}

        {mode === "cloud" && isOnline && (
          <Alert>
            <Cloud className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Nube Activo:</strong> Los permisos se sincronizan automáticamente. Los cambios pueden tardar
              unos segundos en aplicarse.
            </AlertDescription>
          </Alert>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
            Aplicar Cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
