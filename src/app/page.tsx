import { getStores } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'

export default async function Home() {
  // Test Supabase connection
  try {
    const stores = await getStores()
    console.log('✅ Supabase connected! Found', stores.length, 'stores:', stores)
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
  }
  
  redirect('/orders')
}