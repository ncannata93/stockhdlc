'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPage() {
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleSetup = async () => {
    setIsLoading(true)
    setResult(null)
    setIsError(false)

    try {
      const response = await fetch('/api/setup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret })
      })

      const data = await response.json()

      if (!response.ok) {
        setIsError(true)
        setResult(data.error || 'Error desconocido')
      } else {
        setResult(data.message + (data.email ? ` - Email: ${data.email}` : ''))
      }
    } catch (error) {
      setIsError(true)
      setResult('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Inicial</CardTitle>
          <CardDescription>
            Crear o resetear el usuario del sistema. Esto cerrará todas las sesiones activas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secret">Clave de Seguridad (CRON_SECRET)</Label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Ingresa la clave de seguridad"
            />
          </div>
          
          <Button onClick={handleSetup} disabled={isLoading || !secret} className="w-full">
            {isLoading ? 'Procesando...' : 'Crear/Resetear Usuario'}
          </Button>

          {result && (
            <div className={`p-3 rounded text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {result}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
            <p><strong>Usuario:</strong> mallak</p>
            <p><strong>Contraseña:</strong> colapinto</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
