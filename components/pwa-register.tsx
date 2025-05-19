"use client"

import { useEffect } from "react"

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && window.workbox !== undefined) {
      // Registrar el service worker
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
