"use client"

import { useEffect, useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Project, User } from "@/types"
import Link from "next/link"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { UserContext } from "../../../lib/context/user-context"

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const router = useRouter()
  
  // Usar el contexto para obtener el usuario
  const user = useContext(UserContext)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Verificar si tenemos el usuario del contexto
        if (!user) {
          console.error("User not found in context")
          router.push("/login")
          return
        }

        // Primero obtenemos los proyectos
        let query = supabase.from('projects').select('*')

        // Filtrar proyectos según el rol del usuario
        if (user.role === 'client') {
          query = query.eq('client_id', user.id)
        } else if (user.role === 'designer') {
          // Diseñadores solo pueden ver proyectos asignados a ellos
          query = query.eq('designer_id', user.id)
        }
        // Los project_manager pueden ver todos los proyectos (no se aplica filtro)

        // Ordenar por fecha de creación (más recientes primero)
        query = query.order('created_at', { ascending: false })

        const { data: projectsData, error } = await query

        if (error) {
          throw error
        }

        // Ahora obtenemos los perfiles para los diseñadores
        const designerIds = projectsData
          .filter(project => project.designer_id)
          .map(project => project.designer_id);
        
        if (designerIds.length > 0) {
          const { data: designerProfiles, error: designersError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', designerIds);
          
          if (designersError) {
            console.error("Error fetching designers:", designersError);
          } else {
            // Crear un mapa de id -> nombre para búsqueda rápida
            const designerMap = new Map();
            designerProfiles?.forEach(profile => {
              designerMap.set(profile.id, profile.name || 'Unnamed Designer');
            });
            
            // Añadir el nombre del diseñador a cada proyecto
            const projectsWithDesigners = projectsData.map(project => ({
              ...project,
              designer_name: project.designer_id ? designerMap.get(project.designer_id) : null
            }));
            
            setProjects(projectsWithDesigners);
            return;
          }
        }
        
        setProjects(projectsData || []);
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [router, user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      // Delete project files first
      await supabase
        .from('project_files')
        .delete()
        .eq('project_id', projectToDelete)

      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete)

      if (error) {
        throw error
      }

      // Update the projects list
      setProjects(projects.filter(project => project.id !== projectToDelete))
      setIsDeleteDialogOpen(false)
      setProjectToDelete(null)
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
  
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Proyectos</h2>
          {user?.role === 'client' && (
            <Link href="/projects/new">
              <Button variant="gradient">Create New Project</Button>
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="w-full">
            <CardContent className="pt-6 text-center">
              {user?.role === 'designer' ? (
                <p className="text-gray-500">No tienes proyectos asignados actualmente.</p>
              ) : (
                <p className="text-gray-500">No hay proyectos.</p>
              )}
              {user?.role === 'client' && (
                <Link href="/projects/new">
                  <Button className="mt-4" variant="gradient">Create Your First Project</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-col space-y-1">
                    <div className="text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                    {/* Mostrar el diseñador asignado si existe */}
                    {project.designer_id && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 mr-1">Diseñador:</span>
                        <span className="font-medium text-gray-700">{project.designer_name || 'Assigned'}</span>
                      </div>
                    )}
                    {!project.designer_id && (
                      <div className="text-sm text-amber-600">Sin diseñador asignado</div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline">Ver detalles</Button>
                  </Link>
                  {user?.role === 'project_manager' && (
                    <div className="flex space-x-2">
                      <Link href={`/projects/${project.id}/edit`}>
                        <Button variant="secondary" size="sm">Editar</Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClick(project.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Estás seguro que quieres eliminar este proyecto? Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}