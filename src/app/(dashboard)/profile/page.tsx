"use client"

import { useState, useEffect, useContext } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { User } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { UserContext } from "@/lib/context/user-context"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [originalName, setOriginalName] = useState("")
  const [email, setEmail] = useState("")
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Usar el contexto para obtener el usuario
  const user = useContext(UserContext)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Verificar si tenemos el usuario del contexto
        if (!user) {
          console.error("User not found in context")
          router.push("/login")
          return
        }

        // Establecer el nombre del usuario
        setName(user.name || '')
        setEmail(user.email || '')
        setOriginalName(user.name || '')
        setLoading(false)
      } catch (error) {
        console.error("Error fetching profile:", error)
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router, user])

  // Verificar si los datos han cambiado
  const hasChanges = () => {
    return name !== originalName;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar si hay cambios antes de actualizar
    if (!hasChanges()) {
      setSuccess("No changes to update")
      return
    }
    
    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      if (!user) {
        throw new Error("User not found")
      }

      // Update profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name,
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Actualizar el valor original después de una actualización exitosa
      setOriginalName(name)
      setSuccess("Profile updated successfully")
    } catch (error: any) {
      setError(error.message || "An error occurred while updating profile")
    } finally {
      setUpdating(false)
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
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          </div>

          <form onSubmit={handleUpdateProfile} className="px-6 py-5 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">Your email cannot be changed</p>
              </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                type="text"
                value={user?.role || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Your role cannot be changed</p>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
              <Button 
                type="submit" 
                disabled={updating || !hasChanges()}
              >
                {updating ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}