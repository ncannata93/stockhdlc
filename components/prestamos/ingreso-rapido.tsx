"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Zap,
  Upload,
  AlertCircle,
  CheckCircle,
  Cloud,
  WifiOff,
  Database,
  Eye,
  EyeOff,
  Copy,
  FileText,
  MessageCircle,
  List,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  crearPrestamosMasivos,
  verificarConexion,
  verificarTablaPrestamons,
  formatearMonto,
  type PrestamoInput,
} from "@/lib/prestamos-supabase"

interface IngresoRapidoProps {
  onPrestamosCreados?: () => void
}

interface PrestamoParseado extends PrestamoInput {
  linea: number
  valido: boolean
  errores: string[]
}

interface ChatMessage {
  id: number
  role: "user" | "system"
  text: string
  timestamp: Date
  success?: boolean
  prestamo?: PrestamoParseado
}

type ModoIngreso = "chat" | "masivo"

export function IngresoRapido({ onPrestamosCreados }: IngresoRapidoProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [tablaExiste, setTablaExiste] = useState(false)
  const [textoEntrada, setTextoEntrada] = useState("")
  const [prestamosParseados, setPrestamosParseados] = useState<PrestamoParseado[]>([])
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)

  // Chat mode state
  const [modo, setModo] = useState<ModoIngreso>("chat")
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatMsgId, setChatMsgId] = useState(0)
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [showChatHelp, setShowChatHelp] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Ejemplo de formato con comas - mucho más claro
  const ejemploTexto = `Claudia Juan Manuel, Argentina, Falkner, Toallas, 20, 15000
María José, Monaco, Jaguel, Sábanas Blancas, 10, 25000
Juan Carlos, Stromboli, San Miguel, Repuestos Lavarropas, 2, 85000
Claudia, Claudia, Argentina, Brenda, 1, 200000`

  // Verificar conexión al cargar
  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)
      } catch (error) {
        console.error("Error al verificar estado:", error)
        setConectado(false)
        setTablaExiste(false)
      }
    }
    verificarEstado()
  }, [])

  // Parsear texto cuando cambia
  useEffect(() => {
    if (textoEntrada.trim()) {
      parsearTexto(textoEntrada)
    } else {
      setPrestamosParseados([])
    }
  }, [textoEntrada])

  const parsearTexto = (texto: string) => {
    const lineas = texto.split("\n").filter((linea) => linea.trim())
    const prestamosParseados: PrestamoParseado[] = []

    lineas.forEach((linea, index) => {
      console.log(`\n🔍 Parseando línea ${index + 1}: "${linea}"`)

      // Dividir por comas y limpiar espacios
      const partes = linea.split(",").map((parte) => parte.trim())
      const errores: string[] = []

      console.log(`📝 Partes detectadas:`, partes)

      // Validar que tenga exactamente 6 partes
      if (partes.length !== 6) {
        errores.push(
          `Formato incorrecto. Debe tener exactamente 6 campos separados por comas: Responsable, Origen, Destino, Producto, Cantidad, Valor`,
        )
        console.log(`❌ ${partes.length} partes detectadas, se requieren exactamente 6`)
      }

      // Extraer campos directamente por posición
      const responsable = partes[0] || ""
      const hotelOrigen = partes[1] || ""
      const hotelDestino = partes[2] || ""
      const producto = partes[3] || ""
      const cantidad = partes[4] || ""
      const valor = partes[5] || ""

      console.log(`👤 Responsable: "${responsable}"`)
      console.log(`🏨 Origen: "${hotelOrigen}"`)
      console.log(`🏨 Destino: "${hotelDestino}"`)
      console.log(`📦 Producto: "${producto}"`)
      console.log(`📊 Cantidad: "${cantidad}"`)
      console.log(`💰 Valor: "${valor}"`)

      // Validaciones
      if (!responsable.trim()) errores.push("Responsable requerido")
      if (!hotelOrigen.trim()) errores.push("Origen requerido")
      if (!hotelDestino.trim()) errores.push("Destino requerido")
      if (!producto.trim()) errores.push("Producto requerido")
      if (!cantidad.trim()) errores.push("Cantidad requerida")
      if (!valor.trim()) errores.push("Valor requerido")

      if (hotelOrigen === hotelDestino) {
        errores.push("Origen y destino no pueden ser iguales")
      }

      // Validar que valor sea numérico
      const valorNumerico = Number.parseFloat(valor.replace(/[^0-9.-]/g, "") || "0")
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        errores.push("Valor debe ser un número mayor a 0")
        console.log(`❌ Valor inválido: "${valor}" → ${valorNumerico}`)
      }

      const prestamo: PrestamoParseado = {
        linea: index + 1,
        fecha: new Date().toISOString().split("T")[0], // Formato ISO yyyy-MM-dd
        responsable: responsable.trim(),
        hotel_origen: hotelOrigen.trim(),
        hotel_destino: hotelDestino.trim(),
        producto: producto.trim(),
        cantidad: cantidad.trim(),
        valor: valorNumerico,
        estado: "pendiente",
        valido: errores.length === 0,
        errores,
      }

      console.log(`${prestamo.valido ? "✅" : "❌"} Resultado:`, {
        responsable: prestamo.responsable,
        origen: prestamo.hotel_origen,
        destino: prestamo.hotel_destino,
        producto: prestamo.producto,
        cantidad: prestamo.cantidad,
        valor: prestamo.valor,
        errores: prestamo.errores,
      })

      prestamosParseados.push(prestamo)
    })

    setPrestamosParseados(prestamosParseados)
  }

  // Chat: scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Chat: focus input after sending
  useEffect(() => {
    if (!isSendingChat) {
      chatInputRef.current?.focus()
    }
  }, [isSendingChat])

  const parsearLineaChat = (linea: string): PrestamoParseado => {
    const partes = linea.split(",").map((parte) => parte.trim())
    const errores: string[] = []

    if (partes.length !== 6) {
      errores.push(
        `Formato incorrecto (${partes.length} campos). Se necesitan 6: Responsable, Origen, Destino, Producto, Cantidad, Valor`,
      )
    }

    const responsable = partes[0] || ""
    const hotelOrigen = partes[1] || ""
    const hotelDestino = partes[2] || ""
    const producto = partes[3] || ""
    const cantidad = partes[4] || ""
    const valor = partes[5] || ""

    if (!responsable.trim()) errores.push("Responsable requerido")
    if (!hotelOrigen.trim()) errores.push("Origen requerido")
    if (!hotelDestino.trim()) errores.push("Destino requerido")
    if (!producto.trim()) errores.push("Producto requerido")
    if (!cantidad.trim()) errores.push("Cantidad requerida")
    if (!valor.trim()) errores.push("Valor requerido")

    if (hotelOrigen && hotelDestino && hotelOrigen === hotelDestino) {
      errores.push("Origen y destino no pueden ser iguales")
    }

    const valorNumerico = Number.parseFloat(valor.replace(/[^0-9.-]/g, "") || "0")
    if (valor.trim() && (isNaN(valorNumerico) || valorNumerico <= 0)) {
      errores.push("Valor debe ser un numero mayor a 0")
    }

    return {
      linea: 1,
      fecha: new Date().toISOString().split("T")[0],
      responsable: responsable.trim(),
      hotel_origen: hotelOrigen.trim(),
      hotel_destino: hotelDestino.trim(),
      producto: producto.trim(),
      cantidad: cantidad.trim(),
      valor: valorNumerico,
      estado: "pendiente",
      valido: errores.length === 0,
      errores,
    }
  }

  const handleChatSend = async () => {
    const text = chatInput.trim()
    if (!text || isSendingChat) return

    if (!conectado || !tablaExiste) {
      const newId = chatMsgId + 2
      setChatMsgId(newId)
      setChatMessages((prev) => [
        ...prev,
        { id: newId - 1, role: "user", text, timestamp: new Date() },
        {
          id: newId,
          role: "system",
          text: "Sin conexion a Supabase. No se puede guardar.",
          timestamp: new Date(),
          success: false,
        },
      ])
      setChatInput("")
      return
    }

    const userMsgId = chatMsgId + 1
    setChatMsgId(userMsgId)
    setChatMessages((prev) => [...prev, { id: userMsgId, role: "user", text, timestamp: new Date() }])
    setChatInput("")
    setIsSendingChat(true)

    const prestamo = parsearLineaChat(text)

    if (!prestamo.valido) {
      const sysMsgId = userMsgId + 1
      setChatMsgId(sysMsgId)
      setChatMessages((prev) => [
        ...prev,
        {
          id: sysMsgId,
          role: "system",
          text: prestamo.errores.join(". "),
          timestamp: new Date(),
          success: false,
        },
      ])
      setIsSendingChat(false)
      return
    }

    try {
      const resultado = await crearPrestamosMasivos([prestamo])
      const sysMsgId = userMsgId + 1
      setChatMsgId(sysMsgId)

      if (resultado.exitosos > 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: sysMsgId,
            role: "system",
            text: `Guardado: ${prestamo.responsable} | ${prestamo.hotel_origen} -> ${prestamo.hotel_destino} | ${prestamo.producto} x${prestamo.cantidad} | ${formatearMonto(prestamo.valor)}`,
            timestamp: new Date(),
            success: true,
            prestamo,
          },
        ])
        onPrestamosCreados?.()
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: sysMsgId,
            role: "system",
            text: `Error al guardar: ${resultado.errores.join(", ")}`,
            timestamp: new Date(),
            success: false,
          },
        ])
      }
    } catch (error) {
      const sysMsgId = userMsgId + 1
      setChatMsgId(sysMsgId)
      setChatMessages((prev) => [
        ...prev,
        {
          id: sysMsgId,
          role: "system",
          text: "Error de conexion al guardar el prestamo",
          timestamp: new Date(),
          success: false,
        },
      ])
    } finally {
      setIsSendingChat(false)
    }
  }

  const handleSubmit = async () => {
    if (!conectado || !tablaExiste) {
      toast({
        title: "Error de conexión",
        description: "No se puede conectar a Supabase o la tabla no existe",
        variant: "destructive",
      })
      return
    }

    const prestamosValidos = prestamosParseados.filter((p) => p.valido)

    if (prestamosValidos.length === 0) {
      toast({
        title: "No hay préstamos válidos",
        description: "Corrige los errores antes de continuar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const resultado = await crearPrestamosMasivos(prestamosValidos)

      if (resultado.exitosos > 0) {
        toast({
          title: "✅ Préstamos creados",
          description: `${resultado.exitosos} préstamos guardados exitosamente`,
        })

        // Limpiar formulario
        setTextoEntrada("")
        setPrestamosParseados([])
        setMostrarVistaPrevia(false)

        onPrestamosCreados?.()
      }

      if (resultado.errores.length > 0) {
        toast({
          title: "Algunos errores",
          description: `${resultado.errores.length} préstamos no se pudieron guardar`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al crear préstamos:", error)
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los préstamos en Supabase",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const estadoConexion = () => {
    if (!conectado) {
      return (
        <div className="flex items-center gap-1">
          <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          <span className="text-xs text-red-600">Sin conexión</span>
        </div>
      )
    }

    if (!tablaExiste) {
      return (
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          <span className="text-xs text-orange-600">Tabla no existe</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1">
        <Cloud className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        <span className="text-xs text-green-600">Supabase OK</span>
      </div>
    )
  }

  const prestamosValidos = prestamosParseados.filter((p) => p.valido).length
  const prestamosInvalidos = prestamosParseados.filter((p) => !p.valido).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            <span>Ingreso Rapido</span>
          </div>
          <div className="sm:ml-auto">{estadoConexion()}</div>
        </CardTitle>
        <CardDescription className="text-sm">
          Ingresa prestamos de forma rapida y fluida
        </CardDescription>

        {/* Mode toggle */}
        <div className="flex gap-1 mt-3 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setModo("chat")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              modo === "chat"
                ? "bg-white text-sky-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => setModo("masivo")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              modo === "masivo"
                ? "bg-white text-sky-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <List className="h-4 w-4" />
            Masivo
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!conectado && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Sin conexion a Supabase. Los prestamos no se pueden guardar en este momento.
            </AlertDescription>
          </Alert>
        )}

        {conectado && !tablaExiste && (
          <Alert variant="destructive">
            <Database className="h-4 w-4" />
            <AlertDescription className="text-sm">
              La tabla &apos;prestamos&apos; no existe en Supabase.
            </AlertDescription>
          </Alert>
        )}

        {/* ========== MODO CHAT ========== */}
        {modo === "chat" && (
          <div className="flex flex-col">
            {/* Help toggle */}
            <button
              type="button"
              onClick={() => setShowChatHelp(!showChatHelp)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2 self-start"
            >
              <FileText className="h-3 w-3" />
              Formato: Responsable, Origen, Destino, Producto, Cantidad, Valor
              {showChatHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showChatHelp && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-3 text-xs">
                <p className="font-medium text-sky-800 mb-1">Ejemplo:</p>
                <code className="text-sky-700">Claudia, Argentina, Falkner, Toallas, 20, 15000</code>
                <div className="mt-2 text-sky-600 space-y-0.5">
                  <div>1. Responsable (nombre de la persona)</div>
                  <div>2. Hotel Origen (de donde sale)</div>
                  <div>3. Hotel Destino (a donde va)</div>
                  <div>4. Producto (que se presta)</div>
                  <div>5. Cantidad</div>
                  <div>6. Valor ($)</div>
                </div>
              </div>
            )}

            {/* Chat messages area */}
            <div className="border border-gray-200 rounded-lg bg-gray-50 h-80 sm:h-96 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center px-4">
                  <div>
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Escribe un prestamo y presiona Enter</p>
                    <p className="text-xs mt-1 text-gray-300">Ej: Claudia, Argentina, Falkner, Toallas, 20, 15000</p>
                  </div>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-sky-600 text-white rounded-br-md"
                        : msg.success
                          ? "bg-green-100 text-green-800 border border-green-200 rounded-bl-md"
                          : "bg-red-100 text-red-800 border border-red-200 rounded-bl-md"
                    }`}
                  >
                    <p className="break-words">{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user"
                          ? "text-sky-200"
                          : msg.success
                            ? "text-green-500"
                            : "text-red-500"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {isSendingChat && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-2xl rounded-bl-md px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="flex gap-2 mt-3">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleChatSend()
                  }
                }}
                placeholder="Responsable, Origen, Destino, Producto, Cant, Valor"
                disabled={isSendingChat}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={handleChatSend}
                disabled={isSendingChat || !chatInput.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:hover:bg-sky-600 transition-colors shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Chat stats */}
            {chatMessages.filter((m) => m.role === "system" && m.success).length > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-green-600 mt-2">
                <CheckCircle className="h-3 w-3" />
                <span>
                  {chatMessages.filter((m) => m.role === "system" && m.success).length} prestamos guardados en esta sesion
                </span>
              </div>
            )}
          </div>
        )}

        {/* ========== MODO MASIVO (original) ========== */}
        {modo === "masivo" && <>
        {/* Formato de ejemplo - con comas */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h4 className="font-medium text-green-800 flex items-center gap-2 text-sm sm:text-base">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              Formato con comas (sin errores)
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTextoEntrada(ejemploTexto)}
              className="text-xs sm:text-sm h-7 sm:h-8"
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Usar ejemplo
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-green-700 mb-2">
            <strong>Formato:</strong> Responsable, Origen, Destino, Producto, Cantidad, Valor
          </p>
          <p className="text-xs text-green-600 mb-2">
            <strong>✅ Ventajas:</strong> Sin problemas con nombres compuestos, parsing exacto
          </p>
          <div className="bg-white p-2 sm:p-3 rounded border font-mono text-xs overflow-x-auto">
            <div className="whitespace-nowrap sm:whitespace-normal">
              {ejemploTexto.split("\n").map((linea, index) => (
                <div key={index} className="text-gray-600 mb-1 last:mb-0">
                  {linea}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600">
            <strong>🎯 Ejemplos perfectos:</strong>
            <div className="font-mono text-gray-600 mt-1 space-y-1">
              <div>
                <span className="text-green-600">Claudia Juan Manuel</span>,{" "}
                <span className="text-blue-600">Argentina</span>, <span className="text-purple-600">Falkner</span>,{" "}
                <span className="text-orange-600">Toallas</span>, 20, 15000
              </div>
              <div>
                <span className="text-green-600">Claudia</span>, <span className="text-blue-600">Claudia</span>,{" "}
                <span className="text-purple-600">Argentina</span>, <span className="text-orange-600">Brenda</span>, 1,
                200000
              </div>
            </div>
            <div className="mt-1 text-xs">
              <span className="text-green-600">■ Responsable</span> |<span className="text-blue-600">■ Origen</span> |
              <span className="text-purple-600">■ Destino</span> |<span className="text-orange-600">■ Producto</span>
            </div>
          </div>
        </div>

        {/* Área de texto */}
        <div className="space-y-2">
          <Label htmlFor="texto-entrada" className="text-sm font-medium">
            Datos de préstamos (una línea por préstamo, separado por comas)
          </Label>
          <Textarea
            id="texto-entrada"
            placeholder="Ejemplo: Claudia, Claudia, Argentina, Brenda, 1, 200000"
            value={textoEntrada}
            onChange={(e) => setTextoEntrada(e.target.value)}
            rows={6}
            className="font-mono text-xs sm:text-sm resize-none"
          />
        </div>

        {/* Estadísticas y vista previa */}
        {prestamosParseados.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  {prestamosValidos} válidos
                </Badge>
                {prestamosInvalidos > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {prestamosInvalidos} con errores
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                {mostrarVistaPrevia ? (
                  <>
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Vista previa
                  </>
                )}
              </Button>
            </div>

            {/* Vista previa - optimizada para móvil */}
            {mostrarVistaPrevia && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-2 sm:p-3 bg-gray-50 border-b">
                  <h4 className="font-medium text-sm">Vista previa de préstamos</h4>
                </div>
                <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                  {/* Vista móvil - cards */}
                  <div className="sm:hidden space-y-2 p-2">
                    {prestamosParseados.map((prestamo) => (
                      <div
                        key={prestamo.linea}
                        className={`p-2 rounded border text-xs ${prestamo.valido ? "bg-white" : "bg-red-50 border-red-200"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Línea {prestamo.linea}</span>
                          {prestamo.valido ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                              ✓
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              ✗
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div>
                            <strong>{prestamo.responsable}</strong>
                          </div>
                          <div className="text-blue-600">
                            {prestamo.hotel_origen} → {prestamo.hotel_destino}
                          </div>
                          <div>
                            {prestamo.producto} ({prestamo.cantidad})
                          </div>
                          <div className="font-semibold">{formatearMonto(prestamo.valor)}</div>
                          {!prestamo.valido && (
                            <div className="text-red-600 text-xs mt-1">
                              {prestamo.errores.map((error, i) => (
                                <div key={i}>• {error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista desktop - tabla */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Línea</TableHead>
                          <TableHead>Responsable</TableHead>
                          <TableHead>Origen → Destino</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prestamosParseados.map((prestamo) => (
                          <TableRow key={prestamo.linea} className={prestamo.valido ? "" : "bg-red-50"}>
                            <TableCell className="font-mono text-xs">{prestamo.linea}</TableCell>
                            <TableCell className="text-sm">{prestamo.responsable}</TableCell>
                            <TableCell className="text-sm">
                              <span className="text-blue-600">{prestamo.hotel_origen}</span>
                              {" → "}
                              <span className="text-green-600">{prestamo.hotel_destino}</span>
                            </TableCell>
                            <TableCell className="text-sm">{prestamo.producto}</TableCell>
                            <TableCell className="text-sm">{prestamo.cantidad}</TableCell>
                            <TableCell className="text-sm font-semibold">{formatearMonto(prestamo.valor)}</TableCell>
                            <TableCell>
                              {prestamo.valido ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  ✓ Válido
                                </Badge>
                              ) : (
                                <div className="space-y-1">
                                  <Badge variant="destructive">✗ Error</Badge>
                                  <div className="text-xs text-red-600">
                                    {prestamo.errores.map((error, i) => (
                                      <div key={i}>• {error}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón de envío */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !conectado || !tablaExiste || prestamosValidos === 0}
            className="w-full h-10 sm:h-11"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando {prestamosValidos} préstamos...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Crear {prestamosValidos} Préstamos
              </>
            )}
          </Button>

          {conectado && tablaExiste && prestamosValidos > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-green-600">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Listo para guardar {prestamosValidos} prestamos en Supabase</span>
            </div>
          )}
        </div>
        </>}
      </CardContent>
    </Card>
  )
}
