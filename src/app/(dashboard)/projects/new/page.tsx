"use client"

import { useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { UserContext } from "../../../../lib/context/user-context"
import { Skeleton } from "@/components/ui/skeleton"
import  Link  from "next/link"

export default function NewProjectPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [initialLoading, setInitialLoading] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Usar el contexto para obtener el usuario
  const user = useContext(UserContext)

  const isFormValid = () => {
    return title.trim() !== "" && description.trim() !== "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que los campos requeridos no estén vacíos
    if (!isFormValid()) {
      setError("Please fill in all required fields")
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // Verificar si tenemos el usuario del contexto
      if (!user) {
        throw new Error("You must be logged in to create a project")
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          client_id: user.id,
        })
        .select()
        .single()

      if (projectError) {
        throw projectError
      }

      // Upload files
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          const filePath = `${project.id}/${fileName}`

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
              project_id: project.id,
              file_path: filePath,
              file_name: file.name,
              uploaded_by: user.id
            })

          if (fileRecordError) {
            throw fileRecordError
          }
        }
      }

      router.push("/dashboard")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while creating the project";
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
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
        <h1 className="text-2xl font-bold">Create New Project</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
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
                Project Title
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
                Description
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
              <label htmlFor="files" className="block text-sm font-medium text-gray-700">
                Upload Files (optional)
              </label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              {files.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  {files.length} file(s) selected
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link href="/dashboard">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                variant="gradient" 
                disabled={loading || !isFormValid()}
                className="relative"
              >
                {loading ? (
                  <>
                    <span className="opacity-0">Create Project</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}