import CreateUser from "@/scripts/create-user"
import ProtectedRoute from "@/components/protected-route"

export default function AdminCreateUserPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <CreateUser />
    </ProtectedRoute>
  )
}
