"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  UserRole,
  type ModuleName,
  getAllUserRoles,
  updateUserRole,
  updateUserPermissions,
  createUserRole,
  refreshRolesCache,
} from "@/lib/user-permissions"
import { Users, UserPlus, Edit, Shield, Key, CheckCircle, RefreshCw, Cloud, Settings } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"

interface UserRoleData {
  username: string
  role: UserRole
  permissions: ModuleName[]
  createdAt?: string
  updatedAt?: string
  updatedBy?: string
}

const MODULE_LABELS: Record<ModuleName, string> = {
  stock: "Stock",
  empleados: "Empleados",
  servicios: "Servicios",
  admin: "Administración",
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserRoleData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserRoleData | null>(null)
  const [editingUser, setEditingUser] = useState<{
    username: string
    role: UserRole
    permissions: ModuleName[]
  } | null>(null)
  const [newUser, setNewUser] = useState({ username: "", role: UserRole.EMPLOYEE })
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
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
          description: `Usuario ${newUser.username} creado exitosamente`,
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

  const handleEditUser = (user: UserRoleData) => {
    setEditingUser({
      username: user.username,
      role: user.role,
      permissions: [...user.permissions],
    })
    setDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    setIsLoading(true)
    try {
      let result

      if (editingUser.role === UserRole.CUSTOM) {
        // Guardar permisos personalizados
        result = await updateUserPermissions(
          editingUser.username,
          editingUser.permissions,
          session?.username || "admin",
        )
      } else {
        // Guardar rol predefinido
        result = await updateUserRole(editingUser.username, editingUser.role, session?.username || "admin")
      }

      if (result.success) {
        toast({
          title: "Usuario actualizado",
          description: `Cambios guardados para ${editingUser.username}`,
        })
        setDialogOpen(false)
        setEditingUser(null)
        await loadUsers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setDialogOpen(false)
    setEditingUser(null)
  }

  const handleRoleChange = (newRole: UserRole) => {
    if (!editingUser) return

    setEditingUser({
      ...editingUser,
      role: newRole,
      permissions: newRole === UserRole.CUSTOM ? editingUser.permissions : getDefaultPermissions(newRole),
    })
  }

  const handlePermissionToggle = (module: ModuleName, checked: boolean) => {
    if (!editingUser) return

    const newPermissions = checked
      ? [...editingUser.permissions, module]
      : editingUser.permissions.filter((p) => p !== module)

    setEditingUser({
      ...editingUser,
      permissions: newPermissions,
      role: UserRole.CUSTOM, // Cambiar a CUSTOM cuando se modifican permisos manualmente
    })
  }

  const getDefaultPermissions = (role: UserRole): ModuleName[] => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return ["stock", "empleados", "servicios", "admin"]
      case UserRole.MANAGER:
        return ["stock", "empleados", "servicios"]
      case UserRole.EMPLOYEE:
        return ["stock", "empleados"]
      default:
        return []
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
      case UserRole.CUSTOM:
        return "Personalizado"
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
      case UserRole.CUSTOM:
        return "outline"
      default:
        return "outline"
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
                        <TableHead>Permisos</TableHead>
                        <TableHead>Última Actualización</TableHead>
                        <TableHead>Actualizado Por</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.username}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleDisplayName(user.role)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.permissions.map((permission) => (
                                <Badge
                                  key={permission}
                                  variant={permission === "admin" ? "destructive" : "outline"}
                                  className="text-xs"
                                >
                                  {MODULE_LABELS[permission]}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{user.updatedBy || "N/A"}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                    <br />• Personalizado: Permisos específicos (se configura después de crear)
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
                    <TableRow>
                      <TableCell>
                        <Badge variant="outline">Personalizado</Badge>
                      </TableCell>
                      <TableCell>
                        <Settings className="h-4 w-4 text-blue-500" />
                      </TableCell>
                      <TableCell>
                        <Settings className="h-4 w-4 text-blue-500" />
                      </TableCell>
                      <TableCell>
                        <Settings className="h-4 w-4 text-blue-500" />
                      </TableCell>
                      <TableCell>
                        <Settings className="h-4 w-4 text-blue-500" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Alert className="mt-4">
                  <Cloud className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Sistema en la Nube:</strong> Todos los permisos se sincronizan automáticamente entre
                    dispositivos. Los roles personalizados permiten configurar permisos específicos por usuario.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para editar usuario */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuario: {editingUser?.username}</DialogTitle>
              <DialogDescription>
                Modifica el rol y permisos del usuario. Los cambios se guardarán en la nube.
              </DialogDescription>
            </DialogHeader>

            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-role">Rol del Usuario</Label>
                  <Select value={editingUser.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.SUPER_ADMIN}>Super Administrador</SelectItem>
                      <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                      <SelectItem value={UserRole.EMPLOYEE}>Empleado</SelectItem>
                      <SelectItem value={UserRole.CUSTOM}>Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Permisos de Acceso</Label>
                  <div className="space-y-2 mt-2">
                    {(Object.keys(MODULE_LABELS) as ModuleName[]).map((module) => (
                      <div key={module} className="flex items-center space-x-2">
                        <Checkbox
                          id={`permission-${module}`}
                          checked={editingUser.permissions.includes(module)}
                          onCheckedChange={(checked) => handlePermissionToggle(module, checked as boolean)}
                        />
                        <Label htmlFor={`permission-${module}`} className="text-sm">
                          {MODULE_LABELS[module]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {editingUser.role === UserRole.CUSTOM && (
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rol Personalizado:</strong> Los permisos se configuran individualmente. Puedes seleccionar
                      exactamente qué módulos puede acceder este usuario.
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <Cloud className="h-4 w-4" />
                  <AlertDescription>
                    Los cambios se guardarán en la nube y se sincronizarán automáticamente en todos los dispositivos.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUser} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
