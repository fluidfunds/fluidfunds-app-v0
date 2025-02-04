import { useState, useEffect } from 'react'

export function useRole() {
  const [role, setRole] = useState<'manager' | 'investor' | null>(null)

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as 'manager' | 'investor' | null
    setRole(storedRole)
  }, [])

  return role
} 