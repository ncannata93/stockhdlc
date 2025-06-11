"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { UserRole, getAllUserRoles, updateUserRole, createUserRole, refreshRolesCache } from "@/lib/user-permissions"
import { Users, UserPlus, Edit, Shield, Key, CheckCircle, RefreshCw, Cloud } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"

interface UserRoleData {
  username: string
  role: UserRole
  createdAt: string
  updatedAt: string
  updatedBy: string
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserRoleData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserRoleData | null>(null)
  const [newUser, setNewUser] = useState({ username: "", role: UserRole.EMPLOYEE })
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const { session } = useAuth()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const allUsers = await getAllUserRoles()
      setUsers(allUsers)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar usuarios desde la nube",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      refreshRolesCache()
      await loadUsers()
      toast({
        title: "Actualizado",
        description: "Datos sincronizados desde la nube",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al sincronizar datos",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.username) {
      toast({
        title: "Error",
        description: "El nombre de usuario es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await createUserRole(newUser.username, newUser.role, session?.username || "admin")

      if (result.success) {
        toast({
          title: "Usuario creado",
          description: `Usuario ${newUser.username} creado exitosamente en la nube`,
        })
        setNewUser({ username: "", role: UserRole.EMPLOYEE })
        await loadUsers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error inesperado al crear usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUserRole = async (username: string, newRole: UserRole) => {
    try {
      const result = await updateUserRole(username, newRole, session?.username || "admin")

      if (result.success) {
        toast({
          title: "Rol actualizado",
          description: `Rol de ${username} actualizado a ${getRoleDisplayName(newRole)} en la nube`,
        })
        await loadUsers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar el rol",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el rol",
        variant: "destructive",
      })
    }
  }

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "Super Administrador"
      case UserRole.MANAGER:
        return "Gerente"
      case UserRole.EMPLOYEE:
        return "Empleado"
      default:
        return "Desconocido"
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "destructive"
      case UserRole.MANAGER:
        return "default"
      case UserRole.EMPLOYEE:
        return "secondary"
      default:
        return "outline"
    }
  }

  const getModuleAccess = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return ["Stock", "Empleados", "Servicios", "Admin"]
      case UserRole.MANAGER:
        return ["Stock", "Empleados", "Servicios"]
      case UserRole.EMPLOYEE:
        return ["Stock", "Empleados"]
      default:
        return []
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Cloud className="h-8 w-8 text-blue-500" />
              Gestión de Usuarios en la Nube
            </h1>
            <p className="text-gray-600">Administra usuarios y sus permisos sincronizados en Supabase</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Panel de Administración
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios ({users.length})
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Crear Usuario
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Matriz de Permisos
            </TabsTrigger>
          </TabsList>

          {/* Lista de Usuarios */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lista de Usuarios en la Nube
                </CardTitle>
                <CardDescription>
                  Gestiona los usuarios existentes y sus roles. Los cambios se sincronizan automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Cargando usuarios desde la nube...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Accesos</TableHead>
                        <TableHead>Última Actualización</TableHead>
                        <TableHead>Actualizado Por</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const access = getModuleAccess(user.role)

                        return (
                          <TableRow key={user.username}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleDisplayName(user.role)}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {access.map((module) => (
                                  <Badge
                                    key={module}
                                    variant={module === "Admin" ? "destructive" : "outline"}
                                    className="text-xs"
                                  >
                                    {module}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(user.updatedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">{user.updatedBy}</TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar Usuario: {user.username}</DialogTitle>
                                    <DialogDescription>
                                      Modifica el rol y permisos del usuario. Los cambios se guardarán en la nube.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="role">Rol del Usuario</Label>
                                      <Select
                                        value={user.role}
                                        onValueChange={(value) =>
                                          handleUpdateUserRole(user.username, value as UserRole)
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value={UserRole.SUPER_ADMIN}>Super Administrador</SelectItem>
                                          <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                                          <SelectItem value={UserRole.EMPLOYEE}>Empleado</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <Alert>
                                      <Cloud className="h-4 w-4" />
                                      <AlertDescription>
                                        Los cambios se guardarán en la nube y se sincronizarán automáticamente en todos
                                        los dispositivos.
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crear Usuario */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Crear Nuevo Usuario en la Nube
                </CardTitle>
                <CardDescription>
                  Agrega un nuevo usuario al sistema con permisos específicos. Se guardará en Supabase.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Ingresa el nombre de usuario"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Rol del Usuario</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.SUPER_ADMIN}>Super Administrador</SelectItem>
                      <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                      <SelectItem value={UserRole.EMPLOYEE}>Empleado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Roles disponibles:</strong>
                    <br />• Super Administrador: Acceso total al sistema
                    <br />• Gerente: Acceso a Stock, Empleados y Servicios
                    <br />• Empleado: Acceso solo a Stock y Empleados
                  </AlertDescription>
                </Alert>

                <Button onClick={handleCreateUser} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creando en la nube...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Crear Usuario
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matriz de Permisos */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Matriz de Permisos
                </CardTitle>
                <CardDescription>Visualiza qué módulos puede acceder cada rol</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rol</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Empleados</TableHead>
                      <TableHead>Servicios</TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Badge variant="destructive">Super Administrador</Badge>
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge variant="default">Gerente</Badge>
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                      <TableCell>
                        <span className="text-red-500">✗</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge variant="secondary">Empleado</Badge>
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                      <TableCell>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </TableCell>
                      <TableCell>
                        <span className="text-red-500">✗</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-500">✗</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Alert className="mt-4">
                  <Cloud className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Sistema en la Nube:</strong> Todos los permisos se sincronizan automáticamente entre
                    dispositivos. Los cambios pueden tardar hasta 2 minutos en aplicarse completamente.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
