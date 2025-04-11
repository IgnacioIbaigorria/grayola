import { createContext } from "react"
import { User } from "@/types"

// Create user context
export const UserContext = createContext<User | null>(null)