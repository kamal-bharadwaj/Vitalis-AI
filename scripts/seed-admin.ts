import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.')
  console.error('Hint: Run this script with node --env-file=.env.local scripts/seed-admin.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function seedAdmin() {
  console.log('Seeding admin user to Supabase...')
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@medicbot.com',
    password: 'SecureAdminPassword123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'System Admin',
      role: 'admin',
    },
  })

  if (error) {
    console.error('Failed to create admin:', error.message)
    process.exit(1)
  }

  console.log('Admin user created successfully!')
  console.log('User ID:', data.user.id)
  console.log('Email: admin@medicbot.com')
  console.log('Password: SecureAdminPassword123!')
}

seedAdmin()
