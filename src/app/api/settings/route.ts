import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase.from('toko_settings').select('*').limit(1).maybeSingle()
  // Jika tidak ada data awal, kirim objek kosong, bukan error 500
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || {})
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'pemilik') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  // Gunakan ID tetap 1 untuk konfigurasi toko tunggal
  const { data, error } = await supabase.from('toko_settings').upsert({ id: 1, ...body, updated_at: new Date().toISOString() }).select().single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

