import { getSupabase } from './supabase.ts'
import { createUserProfile } from './db.ts'

export async function signUp(email: string, password: string, displayName: string) {
  const sb = getSupabase()
  
  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })
  
  if (authError) {
    console.error('Supabase signup error:', authError)
    throw new Error(authError.message)
  }
  
  if (!authData.user) {
    throw new Error('No user returned from signup')
  }

  console.log('User created:', authData.user.id)
  
  // Auto-confirm the user so they don't need to verify email
  // This uses the service role key to bypass auth restrictions
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (serviceRoleKey) {
      // Create a separate client with service role key for admin operations
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      
      if (url) {
        const adminSb = createClient(url, serviceRoleKey)
        
        // Auto-confirm the user
        const { error: confirmError } = await adminSb.auth.admin.updateUserById(authData.user.id, {
          email_confirmed_at: new Date().toISOString(),
        })
        
        if (confirmError) {
          console.warn('Failed to auto-confirm user, but user was created:', confirmError.message)
        } else {
          console.log('User auto-confirmed:', authData.user.id)
        }
      }
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set - email verification will be required')
    }
  } catch (err) {
    console.warn('Failed to auto-confirm user:', err instanceof Error ? err.message : String(err))
  }
  
  // Create user profile in users table
  try {
    await createUserProfile(authData.user.id, displayName)
  } catch (profileError) {
    console.error('Failed to create user profile:', profileError)
    throw new Error('User created but profile setup failed. Please try signing in.')
  }
  
  return {
    user: {
      id: authData.user.id,
      email: authData.user.email || email,
      user_metadata: {
        display_name: displayName,
      },
    },
    session: authData.session,
  }
}

export async function signIn(email: string, password: string) {
  const sb = getSupabase()
  
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    console.error('Supabase signin error:', error)
    throw new Error(error.message)
  }
  
  return {
    user: {
      id: data.user.id,
      email: data.user.email || email,
      user_metadata: data.user.user_metadata || {},
    },
    session: data.session,
  }
}

export async function signOut(accessToken: string) {
  const sb = getSupabase()
  
  const { error } = await sb.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
}

export function verifyToken(token: string) {
  // Tokens will be verified by Supabase RLS policies
  // Backend should verify tokens before using them
  if (!token) {
    throw new Error('No token provided')
  }
  return token
}
