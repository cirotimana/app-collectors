"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Search, Loader2, UserPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { usersApi, rolesApi, type User, type Role, type CreateUserData, type UpdateUserData } from "@/lib/api"
import { format } from "date-fns"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { ROLES } from "@/lib/permissions"

// esquema de validacion para crear usuario (contraseña obligatoria)
const createUserSchema = z.object({
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  roleId: z.number({ message: "Selecciona un rol" }),
})

// esquema de validacion para editar usuario (contraseña opcional)
const editUserSchema = z.object({
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(6, "Mínimo 6 caracteres").or(z.literal("")),
  roleId: z.number({ message: "Selecciona un rol" }),
})

type UserFormData = z.infer<typeof createUserSchema>

function UsersPageContent() {
  const [users, setUsers] = React.useState<User[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [pagination, setPagination] = React.useState({ page: 1, total: 0, limit: 10 })

  // Formulario para crear usuario (contraseña obligatoria)
  const createForm = useForm<UserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
    },
  })

  // Formulario para editar usuario (contraseña opcional)
  const editForm = useForm<UserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
    },
  })

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true)
      const data = await usersApi.getAll(page, pagination.limit)
      setUsers(data.data)
      setPagination(prev => ({ ...prev, page, total: data.total }))
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await rolesApi.getAll()
      setRoles(data)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al cargar roles")
    }
  }

  React.useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  const handleCreate = async (data: UserFormData) => {
    try {
      await usersApi.create(data as CreateUserData)
      toast.success("Usuario creado exitosamente")
      setIsCreateOpen(false)
      createForm.reset()
      loadUsers(pagination.page)
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario")
    }
  }

  const handleEdit = async (data: UserFormData) => {
    if (!selectedUser) return

    try {
      const updateData: UpdateUserData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        roleId: data.roleId,
      }

      if (data.password && data.password.length > 0) {
        updateData.password = data.password
      }

      await usersApi.update(selectedUser.id, updateData)
      toast.success("Usuario actualizado exitosamente")
      setIsEditOpen(false)
      setSelectedUser(null)
      editForm.reset()
      loadUsers(pagination.page)
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar usuario")
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      await usersApi.delete(selectedUser.id)
      toast.success("Usuario eliminado exitosamente")
      setIsDeleteOpen(false)
      setSelectedUser(null)
      loadUsers(pagination.page)
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar usuario")
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    const userRoleId = user.userRoles?.[0]?.roleId
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      password: "",
      roleId: userRoleId,
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const filteredUsers = (users || []).filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-gray-900">
          Gestión de <span className="text-red-600">Usuarios</span>
        </h1>
        <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>{pagination.total} usuario(s) registrado(s)</CardDescription>
            </div>
            <Button onClick={() => {
              createForm.reset({
                firstName: "",
                lastName: "",
                email: "",
                username: "",
                password: "",
                roleId: undefined,
              })
              setIsCreateOpen(true)
            }} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, email o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Nombre</th>
                      <th className="text-left p-3 font-semibold">Email</th>
                      <th className="text-left p-3 font-semibold">Usuario</th>
                      <th className="text-left p-3 font-semibold">Rol</th>
                      <th className="text-left p-3 font-semibold">Estado</th>
                      <th className="text-center p-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{user.firstName} {user.lastName}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3 font-mono text-sm">{user.username}</td>
                        <td className="p-3">
                          {user.userRoles?.[0]?.role ? (
                            <Badge variant="outline">{user.userRoles[0].role.name}</Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin rol</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(user)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <RoleGuard requireDelete>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openDeleteDialog(user)}
                                title="Eliminar"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </RoleGuard>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No se encontraron usuarios</p>
                  </div>
                )}
              </div>

              {/* paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Página {pagination.page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadUsers(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadUsers(pagination.page + 1)}
                      disabled={pagination.page >= totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* dialog crear usuario */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
            <DialogDescription>Completa los datos del nuevo usuario</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Crear Usuario
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* dialog editar usuario */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los datos del usuario (deja la contraseña vacía para no cambiarla)</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña (opcional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Dejar vacío para no cambiar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* dialog confirmar eliminacion */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
              <strong>{selectedUser?.username}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function UsuariosPage() {
  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR]} redirectTo403={true}>
      <UsersPageContent />
    </RoleGuard>
  )
}
