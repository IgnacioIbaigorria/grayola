"use client"

import { use, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Project, ProjectFile, User } from "@/types"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UserContext } from "../../../../lib/context/user-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ProjectDetailPage({ 
  params, 
}: { 
  params: Promise<{ id: string }>,
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [designers, setDesigners] = useState<User[]>([])
  const [isDesignerDialogOpen, setIsDesignerDialogOpen] = useState(false)
  const [assigningDesigner, setAssigningDesigner] = useState(false)
  const router = useRouter()
  const currentUser = useContext(UserContext);
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertType, setAlertType] = useState<"default" | "destructive">("default")


  // Usar currentUser si está disponible
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser]);

  const fetchProjectData = async () => {
    try {
      // Asegúrate de que id está disponible
      if (!id) {
        console.error("Project ID is undefined")
        setError("Project ID is missing")
        setLoading(false)
        return
      }

      // Si no tenemos el usuario del layout, obtenerlo
      let currentUser = user;
      if (!currentUser) {
        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          router.push("/login")
          return
        }

        // Get user profile with role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          throw profileError
        }

        currentUser = {
          id: authUser.id,
          email: authUser.email!,
          name: profileData.name || 'User',
          role: profileData.role,
          created_at: authUser.created_at,
        }

        setUser(currentUser)
      }

      // Fetch project - asegúrate de que id es una string
      const projectId = String(id)
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) {
        throw projectError
      }

      // Check if user has access to this project
      if (
        currentUser.role !== 'project_manager' && 
        projectData.client_id !== currentUser.id && 
        projectData.designer_id !== currentUser.id
      ) {
        throw new Error("You don't have permission to view this project")
      }

      setProject(projectData)
      console.log("Fetched project:", projectData)

      // Si hay un diseñador asignado, obtener su información
      if (projectData.designer_id) {
        const { data: designerData, error: designerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', projectData.designer_id)
          .single()

        if (!designerError && designerData) {
          console.log("Fetched designer:", designerData)
          // Guardar la información del diseñador en el proyecto
          setProject(prev => prev ? {
            ...prev,
            designer_name: designerData.name || 'Unnamed Designer',
          } : null)
        }
      }

      // Fetch project files
      const { data: filesData, error: filesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)

      if (filesError) {
        throw filesError
      }

      setFiles(filesData || [])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching project data";
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  // Modificar fetchProjectData para no verificar autenticación si ya tenemos el usuario
  useEffect(() => {
    fetchProjectData()
  }, [id, router, user])

  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.file_path)

      if (error) {
        throw error
      }

      // Create a download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  // Add this function to fetch designers
  // Simplificar la función fetchDesigners
  const fetchDesigners = async () => {
    try {
      console.log("Fetching all profiles without filtering...");
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
        
      if (!authUser) {
        router.push("/login")
        return
      }

      // Obtener todos los perfiles sin filtrar por rol
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (allProfilesError) {
        console.error("Error fetching all profiles:", allProfilesError);
        throw allProfilesError;
      }
      
      console.log("All profiles:", allProfiles);
      
      // Filtrar manualmente los diseñadores
      const designerProfiles = allProfiles?.filter(profile => profile.role === 'designer') || [];
      console.log("Filtered designers:", designerProfiles);
      
      // Convertir los perfiles a usuarios
      const designerUsers: User[] = designerProfiles.map(profile => ({
        id: profile.id,
        email: authUser.email || 'No email',
        name: profile.name || `Designer ${profile.id.substring(0, 4)}`, // Add name with fallback
        role: profile.role,
        created_at: profile.created_at
      }));

      setDesigners(designerUsers);
      
      // Si no hay diseñadores, mostrar un mensaje
      if (designerUsers.length === 0) {
        console.log("No designers found in the database. Available roles:", 
          [...new Set(allProfiles?.map(p => p.role) || [])]);
      }
    } catch (error) {
      console.error('Error fetching designers:', error);
    }
  }

  const handleAssignDesigner = async () => {
    setIsDesignerDialogOpen(true);
    try {
      await fetchDesigners();
    } catch (error) {
      console.error("Error in handleAssignDesigner:", error);
    }
  }

  const assignDesigner = async (designerId: string) => {
    setAssigningDesigner(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({ designer_id: designerId })
        .eq('id', project?.id)

      if (error) {
        throw error
      }

      // Update the project in state
      setProject(prev => prev ? { ...prev, designer_id: designerId } : null)
      setIsDesignerDialogOpen(false);
      // Mostrar alerta de éxito
      setAlertMessage("Designer assigned successfully!")
      setAlertType("default")
      setShowAlert(true)      
      setTimeout(() => {
        setShowAlert(false)
        fetchProjectData();
      }, 3000)
    } catch (error: any) {
      console.error('Error assigning designer:', error)
      setAlertMessage("Failed to assign designer")
      setAlertType("destructive")
      setShowAlert(true)
    } finally {
      setAssigningDesigner(false)
    }
  }
    // Añadir esta función para desasignar diseñadores
  const unassignDesigner = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ designer_id: null })
        .eq('id', project?.id)
  
      if (error) {
        throw error
      }
  
      // Actualizar el proyecto en el estado
      setProject(prev => prev ? { 
        ...prev, 
        designer_id: null,
        designer_name: undefined,
        designer_email: undefined
      } : null)
        
      // Mostrar alerta de éxito
      setAlertMessage("Designer unassigned successfully!")
      setAlertType("default")
      setShowAlert(true)
      
      // Ocultar la alerta después de 3 segundos
      setTimeout(() => {
        setShowAlert(false)
      }, 3000)
    } catch (error: any) {
      console.error('Error unassigning designer:', error)
      setAlertMessage("Failed to unassign designer")
      setAlertType("destructive")
      setShowAlert(true)
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
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">Project not found.</p>
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {showAlert && (
          <div className="mb-4">
            <Alert variant={alertType}>
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          </div>
        )}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Back
              </Button>
              {user?.role === 'project_manager' && (
                <>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <Button onClick={handleAssignDesigner}>
                    Assign Designer
                  </Button>
                  {project.designer_id && (
                    <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50"                    onClick={unassignDesigner}>
                      Unassign Designer 
                      </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="px-6 py-5">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{project.description}</p>
          </div>

          <div className="px-6 py-5 border-t border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Files</h2>
            {files.length === 0 ? (
              <p className="text-gray-500">No files uploaded for this project.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {files.map((file) => (
                  <li key={file.id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg 
                        className="h-6 w-6 text-gray-400 mr-3" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadFile(file)}
                    >
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-6 py-5 border-t border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Project Details</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(project.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(project.updated_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {project.designer_id ? "Assigned" : "Unassigned"}
                </dd>
              </div>
              {project.designer_id && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Designer</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.designer_name || 'Assigned Designer'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        <Dialog open={isDesignerDialogOpen} onOpenChange={setIsDesignerDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>Assign Designer</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                {designers.length === 0 ? (
                    <p className="text-gray-500">No designers available.</p>
                ) : (
                    // In your Dialog component, update to show names
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                    {designers.map((designer) => (
                        <div 
                        key={designer.id} 
                        className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        onClick={() => !assigningDesigner && assignDesigner(designer.id)}
                        >
                        <div>
                            <p className="font-medium">{designer.name || 'Unnamed Designer'}</p>
                            <p className="text-sm text-gray-500">{designer.email}</p>
                        </div>
                        <Button 
                            size="sm" 
                            disabled={assigningDesigner}
                            onClick={(e) => {
                            e.stopPropagation();
                            assignDesigner(designer.id);
                            }}
                        >
                            Assign
                        </Button>
                        </div>
                    ))}
                    </div>
                )}
                </div>
                <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDesignerDialogOpen(false)}>
                    Cancel
                </Button>
                </div>
            </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}