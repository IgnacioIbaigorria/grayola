"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Project, User, ProjectFile } from "@/types"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
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

        const currentUser = {
          id: authUser.id,
          email: authUser.email!,
          role: profileData.role,
          created_at: authUser.created_at,
        }

        setUser(currentUser)

        // Check if user is a project manager
        if (currentUser.role !== 'project_manager') {
          throw new Error("Only project managers can edit projects")
        }

        // Fetch project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single()

        if (projectError) {
          throw projectError
        }

        // Fetch project files
        const { data: filesData, error: filesError } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', id)

        if (filesError) {
          throw filesError
        }

        // Set form values
        setTitle(project.title)
        setDescription(project.description)
        setFiles(filesData || [])
        setLoading(false)
      } catch (error: any) {
        setError(error.message || "An error occurred while fetching project data")
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Update project
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          title,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      // Upload new files
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          const filePath = `${id}/${fileName}`

          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(filePath, file)

          if (uploadError) {
            throw uploadError
          }

          // Create file record in database
          const { error: fileRecordError } = await supabase
            .from('project_files')
            .insert({
              project_id: id,
              file_path: filePath,
              file_name: file.name,
            })

          if (fileRecordError) {
            throw fileRecordError
          }
        }
      }

      router.push(`/projects/${id}`)
    } catch (error: any) {
      setError(error.message || "An error occurred while updating the project")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFileClick = (file: ProjectFile) => {
    setFileToDelete(file)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteFile = async () => {
    if (!fileToDelete) return

    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([fileToDelete.file_path])

      if (storageError) {
        throw storageError
      }

      // Delete file record from database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileToDelete.id)

      if (dbError) {
        throw dbError
      }

      // Update files list
      setFiles(files.filter(f => f.id !== fileToDelete.id))
      setIsDeleteDialogOpen(false)
      setFileToDelete(null)
    } catch (error: any) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar proyecto</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título del proyecto
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Archivos actuales
              </label>
              {files.length === 0 ? (
                <p className="text-sm text-gray-500">No hay archivos adjuntos en este proyecto.</p>
              ) : (
                <ul className="divide-y divide-gray-200 border rounded-md">
                  {files.map((file) => (
                    <li key={file.id} className="flex justify-between items-center p-3">
                      <span className="text-sm">{file.file_name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteFileClick(file)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="newFiles" className="block text-sm font-medium text-gray-700">
                Agregar nuevos archivos
              </label>
              <Input
                id="newFiles"
                type="file"
                multiple
                onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
              />
              {newFiles.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  {newFiles.length} new file(s) selected
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link href={`/projects/${id}`}>
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" variant="gradient" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete File Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Seguro que quieres eliminar el archivo "{fileToDelete?.file_name}"? Esta acción no se puede deshacer.</p>
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
              onClick={handleDeleteFile}
            >
              Eliminar archivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}