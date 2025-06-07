"use client"

import React from "react"

import { useState } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type: "success" | "error" | "info", duration?: number) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: "success" | "error" | "info", duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, type, duration }

    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, duration)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center p-4 rounded-lg shadow-lg max-w-sm
              ${toast.type === "success" ? "bg-green-50 border border-green-200" : ""}
              ${toast.type === "error" ? "bg-red-50 border border-red-200" : ""}
              ${toast.type === "info" ? "bg-blue-50 border border-blue-200" : ""}
            `}
          >
            {toast.type === "success" && <CheckCircle className="h-5 w-5 text-green-600 mr-3" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5 text-red-600 mr-3" />}
            {toast.type === "info" && <Info className="h-5 w-5 text-blue-600 mr-3" />}

            <span
              className={`
              text-sm font-medium flex-1
              ${toast.type === "success" ? "text-green-800" : ""}
              ${toast.type === "error" ? "text-red-800" : ""}
              ${toast.type === "info" ? "text-blue-800" : ""}
            `}
            >
              {toast.message}
            </span>

            <button onClick={() => removeToast(toast.id)} className="ml-3 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
