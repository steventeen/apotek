import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { Toaster } from '@/components/ui/sonner'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'pemilik') redirect('/kasir')


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SettingsHeader />
      <main className="flex-1 py-12 px-4 max-w-4xl mx-auto w-full space-y-6">
        <h1 className="text-3xl font-bold">Pengaturan Toko</h1>
        <SettingsForm />
        <Toaster position="top-right" richColors />
      </main>
    </div>
  )
}

// Small client component wrapper for settings or just import AppHeader
import { AppHeader } from '@/components/shared/AppHeader'
function SettingsHeader() {
  return <AppHeader title="Pengaturan Toko" />
}
