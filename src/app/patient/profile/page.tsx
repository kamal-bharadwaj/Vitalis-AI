import { Metadata } from 'next'
import { requirePatient } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'My Profile',
}

export default async function PatientProfilePage() {
  const user = await requirePatient()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const fields = [
    { label: 'Full Name', value: profile?.full_name, icon: User },
    { label: 'Email', value: profile?.email, icon: Mail },
    { label: 'Phone', value: profile?.phone, icon: Phone },
    { label: 'Gender', value: profile?.gender, icon: User, capitalize: true },
    {
      label: 'Date of Birth',
      value: profile?.date_of_birth
        ? format(new Date(profile.date_of_birth), 'MMMM d, yyyy')
        : null,
      icon: Calendar,
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Your account information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-muted border border-border flex items-center justify-center text-2xl font-bold text-muted-foreground">
          {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">{profile?.full_name}</p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <Shield className="size-3.5" />
            Patient account
          </div>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center gap-4 px-6 py-4">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <field.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">{field.label}</p>
              <p className={`text-sm font-medium text-foreground ${field.capitalize ? 'capitalize' : ''}`}>
                {field.value || <span className="text-muted-foreground/50 font-normal">Not set</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Account Info */}
      <div className="bg-muted/30 border border-border rounded-xl px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Member since{' '}
          <span className="font-medium text-foreground">
            {profile?.created_at
              ? format(new Date(profile.created_at), 'MMMM d, yyyy')
              : '—'}
          </span>
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        To update your profile information, please contact your healthcare provider.
      </p>
    </div>
  )
}
