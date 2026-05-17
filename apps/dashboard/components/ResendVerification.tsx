'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResendVerification({ email }: { email: string }) {
  const [sent, setSent] = useState(false)

  async function resend() {
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    setSent(true)
  }

  return sent ? (
    <span className="text-sm">Verification email sent.</span>
  ) : (
    <button
      onClick={resend}
      className="text-sm underline hover:no-underline"
    >
      Resend verification email
    </button>
  )
}
