'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = { email: string }

export default function AccountSection({ email }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword || !newPassword) return
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (signInError) throw new Error('Current password is incorrect.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw new Error(updateError.message)

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <div className="flex items-center gap-3">
          <input
            type="email"
            value={email}
            disabled
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
          />
          <span className="text-xs text-gray-400">Contact support to change</span>
        </div>
      </div>

      {/* Password change */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Change password</p>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Password updated successfully.</p>}

          <button
            type="submit"
            disabled={!currentPassword || !newPassword || loading}
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
