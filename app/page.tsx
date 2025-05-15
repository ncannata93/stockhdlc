import { FirebaseProvider } from "@/components/firebase-provider"
import StockManagement from "@/components/stock-management"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <FirebaseProvider>
          <StockManagement />
        </FirebaseProvider>
      </div>
    </main>
  )
}
