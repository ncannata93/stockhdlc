import UserManagement from "@/components/user-management"
import ProtectedRoute from "@/components/protected-route"

export default function AdminUsersPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <UserManagement />
      </div>
    </ProtectedRoute>
  )
}
