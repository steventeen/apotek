import { LoginForm } from '@/components/auth/LoginForm'
import { Toaster } from '@/components/ui/sonner'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm />
      <Toaster position="top-right" richColors />
    </div>
  )
}
