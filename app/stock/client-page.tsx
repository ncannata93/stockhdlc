"use client"

import { useState } from "react"
import StockManagement from "@/components/stock-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ClientPage = () => {
  const [activeTab, setActiveTab] = useState("stock")

  return (
    <div className="w-full">
      <Tabs value={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="stock" onClick={() => setActiveTab("stock")}>
            Stock Management
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <StockManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ClientPage
