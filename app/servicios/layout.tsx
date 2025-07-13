import type { ReactNode } from "react"

interface ServiciosLayoutProps {
  children: ReactNode
}

export default function ServiciosLayout({ children }: ServiciosLayoutProps) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
