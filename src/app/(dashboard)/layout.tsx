"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { User } from "@/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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
          throw profileError
        }

        const currentUser = {
          id: authUser.id,
          email: authUser.email!,
          name: profileData.name || 'User',
          role: profileData.role,
          created_at: authUser.created_at,
        }

        setUser(currentUser)
      } catch (error) {
        console.error("Error fetching user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
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

      <main>{children}</main>
    </div>
  )
}