"use client"

import { useEffect } from "react"

// Extender el tipo Window para incluir workbox
declare global {
  interface Window {
    workbox?: any
  }
}

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Registrar el service worker sin depender de workbox
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registrado con éxito:", registration)
          })
          .catch((error) => {
            console.error("Error al registrar el Service Worker:", error)
          })
      }
    }
  }, [])

  return null
}
