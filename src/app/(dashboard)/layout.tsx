"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { User } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import React from "react"
import { UserContext } from "@/lib/context/user-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
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
          console.error("Profile error:", profileError)
          // En lugar de lanzar error, redirigir al login
          router.push("/login")
          return
        }

        const currentUser = {
          id: authUser.id,
          email: authUser.email!,
          name: profileData?.name || 'User',
          role: profileData?.role || 'client',
          created_at: authUser.created_at,
        }

        setUser(currentUser)
        // Establecer que la autenticación ha sido verificada
        setAuthChecked(true)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching user:", error)
        setLoading(false) // Asegúrate de que loading se establezca en false incluso en caso de error
        router.push("/login")
      }
    }

    fetchUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Mostrar un estado de carga mientras verificamos la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Loading...</h2>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-32 w-full" />
            <div className="flex justify-center space-x-4 mt-6">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Si la autenticación ha sido verificada, mostrar el layout completo
  if (authChecked) {
    return (
      <UserContext.Provider value={user}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                      Design Platform
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link 
                      href="/dashboard" 
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        pathname === "/dashboard" 
                          ? "border-indigo-500 text-gray-900" 
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      Dashboard
                    </Link>
                    {user?.role === 'client' && (
                      <Link 
                        href="/projects/new" 
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                          pathname === "/projects/new" 
                            ? "border-indigo-500 text-gray-900" 
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                      >
                        New Project
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center space-x-4">
                    <div className="text-sm text-gray-700">
                      {user?.name || user?.email}
                    </div>
                    <Link href="/profile">
                      <Button variant="outline" size="sm">
                        Profile
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      Sign out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <main>
            {children}
          </main>
        </div>
      </UserContext.Provider>
    )
  }

  // Si llegamos aquí, algo salió mal con la autenticación
  return null;
}