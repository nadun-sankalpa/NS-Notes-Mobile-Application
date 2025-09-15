import { onAuthStateChanged, User } from "firebase/auth"
import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { auth } from "../firebase"

const AUthContext = createContext<{user: User | null, loading: boolean}>({
  user: null,
  loading: true
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() =>{
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ?? null)
      setLoading(false)
    })
    return unsubscribe
  },[])

  return (
    <AUthContext.Provider value={{ user, loading }}>
      {children}
    </AUthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AUthContext)
}