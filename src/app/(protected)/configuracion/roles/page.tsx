"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Search, Loader2, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { rolesApi, type Role, type CreateRoleData, type UpdateRoleData } from "@/lib/api"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { ROLES } from "@/lib/permissions"

// esquema de validacion
const roleSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres"),
  description: z.string().min(5, "Minimo 5 caracteres"),
})

type RoleFormData = z.infer<typeof roleSchema>

function RolesPageContent() {
  const [roles, setRoles] = React.useState<Role[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const loadRoles = async () => {
    try {
      setLoading(true)
      const data = await rolesApi.getAll()
      setRoles(data)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al cargar roles")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadRoles()
  }, [])

  const handleCreate = async (data: RoleFormData) => {
    try {
      await rolesApi.create(data as CreateRoleData)
      toast.success("Rol creado exitosamente")
      setIsCreateOpen(false)
      form.reset()
      loadRoles()
    } catch (error: any) {
      toast.error(error.message || "Error al crear rol")
    }
  }

  const handleEdit = async (data: RoleFormData) => {
    if (!selectedRole) return
    
    try {
      await rolesApi.update(selectedRole.id, data as UpdateRoleData)
      toast.success("Rol actualizado exitosamente")
      setIsEditOpen(false)
      setSelectedRole(null)
      form.reset()
      loadRoles()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar rol")
    }
  }

  const handleDelete = async () => {
    if (!selectedRole) return
    
    try {
      await rolesApi.delete(selectedRole.id)
      toast.success("Rol eliminado exitosamente")
      setIsDeleteOpen(false)
      setSelectedRole(null)
      loadRoles()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar rol")
    }
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    form.reset({
      name: role.name,
      description: role.description,
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role)
    setIsDeleteOpen(true)
  }

  const filteredRoles = (roles || []).filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // paginacion local
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-gray-900">
          Gestión de <span className="text-red-600">Roles</span>
        </h1>
        <p className="text-gray-600 mt-1">Administra los roles del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>{roles.length} rol(es) registrado(s)</CardDescription>
            </div>
            <Button onClick={() => {
              form.reset({
                name: "",
                description: "",
              })
              setIsCreateOpen(true)
            }} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Rol
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o descripción..."
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
                      <th className="text-left p-3 font-semibold">Descripción</th>
                      <th className="text-center p-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRoles.map((role) => (
                      <tr key={role.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-semibold">{role.name}</td>
                        <td className="p-3 text-sm text-gray-600">{role.description}</td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(role)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openDeleteDialog(role)}
                              title="Eliminar"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {paginatedRoles.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No se encontraron roles</p>
                  </div>
                )}
              </div>

              {/* paginacion */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages} ({filteredRoles.length} roles)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage >= totalPages}
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

      {/* dialog crear rol */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Rol</DialogTitle>
            <DialogDescription>Completa los datos del nuevo rol</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ADMIN" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripción del rol" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Crear Rol
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* dialog editar rol */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>Modifica los datos del rol</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
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
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
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
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el rol{" "}
              <strong>{selectedRole?.name}</strong>.
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

export default function RolesPage() {
  return (
    <RoleGuard allowedRoles={[ROLES.ADMINISTRATOR]} redirectTo403={true}>
      <RolesPageContent />
    </RoleGuard>
  )
}
