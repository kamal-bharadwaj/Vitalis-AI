import Link from 'next/link'
import { format } from 'date-fns'
import { User, ChevronRight, FileText } from 'lucide-react'

interface Patient {
  id: string
  full_name: string
  email: string
  phone: string | null
  gender: string | null
  date_of_birth: string | null
  created_at: string
  document_count?: number
}

interface PatientsTableProps {
  patients: Patient[]
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <User className="size-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">No patients yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Patients will appear here once they register. Share the registration link to get started.
      </p>
    </div>
  )
}

export default function PatientsTable({ patients }: PatientsTableProps) {
  if (patients.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground">Patient</th>
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden md:table-cell">
                Contact
              </th>
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden lg:table-cell">
                Gender
              </th>
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden lg:table-cell">
                Date of Birth
              </th>
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden sm:table-cell">
                Reports
              </th>
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground hidden md:table-cell">
                Joined
              </th>
              <th className="px-6 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, idx) => (
              <tr
                key={patient.id}
                className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${
                  idx % 2 === 0 ? '' : 'bg-muted/10'
                }`}
              >
                {/* Name + Email */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {patient.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                    </div>
                  </div>
                </td>

                {/* Phone */}
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-muted-foreground">
                    {patient.phone || <span className="text-muted-foreground/40">—</span>}
                  </span>
                </td>

                {/* Gender */}
                <td className="px-6 py-4 hidden lg:table-cell">
                  {patient.gender ? (
                    <span className="capitalize text-muted-foreground">{patient.gender}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>

                {/* DOB */}
                <td className="px-6 py-4 hidden lg:table-cell">
                  {patient.date_of_birth ? (
                    <span className="text-muted-foreground">
                      {format(new Date(patient.date_of_birth), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>

                {/* Documents */}
                <td className="px-6 py-4 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="size-3.5" />
                    <span>{patient.document_count ?? 0}</span>
                  </div>
                </td>

                {/* Joined */}
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-muted-foreground">
                    {format(new Date(patient.created_at), 'MMM d, yyyy')}
                  </span>
                </td>

                {/* Action */}
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/patients/${patient.id}`}
                    id={`view-patient-${patient.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors"
                    aria-label={`View ${patient.full_name}`}
                  >
                    View
                    <ChevronRight className="size-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
