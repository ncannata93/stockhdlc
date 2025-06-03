"use client"

import { useState } from "react"
import { Tabs, Tab } from "@nextui-org/react"
import Inicio from "./components/Inicio"
import EmpleadosList from "./components/EmpleadosList"
import Agregar from "./components/Agregar"
import Historial from "./components/Historial"
import Resumen from "./components/Resumen"
import Calendario from "./components/Calendario"

const ClientPage = () => {
  const [activeTab, setActiveTab] = useState("inicio")

  return (
    <div className="container mx-auto py-4">
      <Tabs
        aria-label="Options"
        color="primary"
        variant="underlined"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
      >
        <Tab key="inicio" title="Inicio" />
        <Tab key="empleados" title="Empleados" />
        <Tab key="agregar" title="Agregar" />
        <Tab key="historial" title="Historial" />
        <Tab key="resumen" title="Resumen" />
        <Tab key="calendario" title="Calendario" />
      </Tabs>

      <div className="mt-4">
        {activeTab === "inicio" && <Inicio />}
        {activeTab === "empleados" && <EmpleadosList />}
        {activeTab === "agregar" && <Agregar />}
        {activeTab === "historial" && <Historial />}
        {activeTab === "resumen" && <Resumen />}
        {activeTab === "calendario" && <Calendario />}
      </div>
    </div>
  )
}

export default ClientPage
