import CreateUserAlt from "@/scripts/create-user-alt"
import ProtectedRoute from "@/components/protected-route"

export default function AdminCreateUserAltPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <CreateUserAlt />
    </ProtectedRoute>
  )
}
