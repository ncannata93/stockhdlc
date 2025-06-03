"use client"

import type React from "react"

interface ClientPageProps {
  onNavigate?: (path: string) => void
}

const ClientPage: React.FC<ClientPageProps> = ({ onNavigate }) => {
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      console.warn("onNavigate prop is not defined.")
    }
  }

  return (
    <div>
      <h1>Servicios Client Page</h1>
      <button onClick={() => handleNavigation("/home")}>Go to Home</button>
      <button onClick={() => handleNavigation("/about")}>Go to About</button>
    </div>
  )
}

export default ClientPage
