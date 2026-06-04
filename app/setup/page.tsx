'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupPage() {
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
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (!response.ok) {
        setIsError(true)
        setResult(data.error || 'Error desconocido')
      } else {
        setResult(data.message)
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
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <p className="font-medium text-amber-800 mb-2">Se creará el siguiente usuario:</p>
            <p className="text-amber-700"><strong>Usuario:</strong> mallak</p>
            <p className="text-amber-700"><strong>Contraseña:</strong> colapinto</p>
          </div>
          
          <Button onClick={handleSetup} disabled={isLoading} className="w-full">
            {isLoading ? 'Procesando...' : 'Crear/Resetear Usuario'}
          </Button>

          {result && (
            <div className={`p-3 rounded text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
