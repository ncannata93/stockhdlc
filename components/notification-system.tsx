"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, Bell, CheckCircle } from "lucide-react"
import type { Product, InventoryItem } from "@/lib/local-db"

export type Notification = {
  id: string
  type: "warning" | "info" | "success"
  title: string
  message: string
  timestamp: Date
  read: boolean
}

export type NotificationContextValue = {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

// Hook para gestionar las notificaciones
export function useNotifications(): NotificationContextValue {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Recuperar notificaciones del localStorage al iniciar
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem("stockNotifications")
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications)
        // Convertir las cadenas de fecha a objetos Date
        const processedNotifications = parsedNotifications.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp),
        }))
        setNotifications(processedNotifications)
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
    }
  }, [])

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem("stockNotifications", JSON.stringify(notifications))
    } catch (error) {
      console.error("Error al guardar notificaciones:", error)
    }
  }, [notifications])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    clearAllNotifications,
  }
}

// Función para verificar productos con stock bajo
export function checkLowStockLevels(products: Product[], inventory: InventoryItem[]): Product[] {
  return products.filter((product) => {
    const inventoryItem = inventory.find((item) => item.productId === product.id)
    return inventoryItem && inventoryItem.quantity < product.min_stock
  })
}

// Componente de notificación individual
export function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification
  onDismiss: () => void
}) {
  const bgColor =
    notification.type === "warning"
      ? "bg-amber-50 border-amber-200"
      : notification.type === "success"
        ? "bg-green-50 border-green-200"
        : "bg-blue-50 border-blue-200"

  const textColor =
    notification.type === "warning"
      ? "text-amber-800"
      : notification.type === "success"
        ? "text-green-800"
        : "text-blue-800"

  const iconColor =
    notification.type === "warning"
      ? "text-amber-500"
      : notification.type === "success"
        ? "text-green-500"
        : "text-blue-500"

  const Icon = notification.type === "warning" ? AlertTriangle : notification.type === "success" ? CheckCircle : Bell

  return (
    <div className={`p-4 rounded-lg border mb-3 ${bgColor} ${!notification.read ? "shadow-md" : ""}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <Icon className={`h-5 w-5 ${iconColor} mt-0.5 mr-2`} />
          <div>
            <h4 className={`font-medium ${textColor}`}>{notification.title}</h4>
            <p className={`text-sm ${textColor}`}>{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">{notification.timestamp.toLocaleString()}</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Componente para mostrar notificaciones
export function NotificationsPanel({
  notifications,
  markAsRead,
  removeNotification,
  clearAllNotifications,
}: Omit<NotificationContextValue, "addNotification">) {
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Marcar todas como leídas al abrir el panel
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      notifications.forEach((n) => {
        if (!n.read) markAsRead(n.id)
      })
    }
  }, [isOpen, notifications, markAsRead, unreadCount])

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-100">
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-600 text-xs text-white text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-medium">Notificaciones</h3>
            {notifications.length > 0 && (
              <button onClick={clearAllNotifications} className="text-xs text-gray-500 hover:text-gray-700">
                Limpiar todo
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto p-3">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No hay notificaciones</p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDismiss={() => removeNotification(notification.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
