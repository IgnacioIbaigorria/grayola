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
import { Menu, X } from "lucide-react" // Importar iconos para el menú

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // Estado para el menú móvil
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
                  {/* Navegación para escritorio - oculta en móvil */}
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
                  {/* Información de usuario y botones para escritorio */}
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
                  
                  {/* Botón de menú hamburguesa para móvil */}
                  <div className="flex items-center sm:hidden">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                      aria-expanded="false"
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                      <span className="sr-only">Open main menu</span>
                      {mobileMenuOpen ? (
                        <X className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Menu className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Menú móvil - panel deslizante desde la derecha */}
            <div 
              className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              } sm:hidden`}
            >
              <div className="h-full flex flex-col">
                <div className="px-4 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium text-gray-900">Menu</div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="py-4 space-y-1">
                    <Link
                      href="/dashboard"
                      className={`block px-4 py-3 text-base font-medium ${
                        pathname === "/dashboard"
                          ? "text-indigo-700 bg-indigo-50"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {user?.role === 'client' && (
                      <Link
                        href="/projects/new"
                        className={`block px-4 py-3 text-base font-medium ${
                          pathname === "/projects/new"
                            ? "text-indigo-700 bg-indigo-50"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        New Project
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className={`block px-4 py-3 text-base font-medium ${
                        pathname === "/profile"
                          ? "text-indigo-700 bg-indigo-50"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 p-4">
                  <div className="mb-4">
                    <div className="text-base font-medium text-gray-800">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
            
            {/* Overlay para cerrar el menú al hacer clic fuera */}
            {mobileMenuOpen && (
              <div 
                className="fixed inset-0 backdrop-blur-sm z-40 sm:hidden"
                onClick={() => setMobileMenuOpen(false)}
              ></div>
            )}
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