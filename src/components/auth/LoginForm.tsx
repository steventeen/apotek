'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Delete, X, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (currentPin: string) => {
    setLoading(true)
    try {
      const { data: userProfile, error: profileError } = await supabase.from('users').select('id, role').eq('pin', currentPin).maybeSingle()
      if (profileError || !userProfile) {
        toast.error('PIN salah')
        setPin('')
        return
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: `user_${userProfile.id}@ulebi.internal`,
        password: currentPin,
      })

      if (loginError) {
        toast.error('Gagal: ' + loginError.message)
        setPin('')
        return
      }

      const role = userProfile.role
      router.push((role === 'pemilik' || role === 'apoteker') ? '/dashboard' : '/kasir')
      router.refresh()
    } catch { toast.error('Error sistem') } finally { setLoading(false) }
  }

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num
      setPin(newPin)
      if (newPin.length === 4) handleLogin(newPin)
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto shadow-2xl">
      <CardHeader className="text-center bg-blue-600 text-white">
        <CardTitle>Apotek Ulebi</CardTitle>
        <CardDescription className="text-blue-100">PIN 4 Digit</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex justify-center gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${pin.length > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <Button key={n} variant="outline" className="h-14 text-xl" onClick={() => handleNumber(n.toString())} disabled={loading}>{n}</Button>
          ))}
          <Button variant="ghost" onClick={() => setPin('')} disabled={loading}><X /></Button>
          <Button variant="outline" className="h-14 text-xl" onClick={() => handleNumber('0')} disabled={loading}>0</Button>
          <Button variant="ghost" onClick={() => setPin(prev => prev.slice(0, -1))} disabled={loading}><Delete /></Button>
        </div>
        {loading && <div className="mt-4 text-center text-blue-600 animate-pulse flex justify-center items-center"><Loader2 className="animate-spin mr-2" /> Memeriksa...</div>}
      </CardContent>
    </Card>
  )
}
