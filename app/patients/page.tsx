"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PatientManagement } from "@/components/patient-management"
import { Button } from "@/components/ui/button"

export default function PatientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">Patient Management</h1>
          <div className="flex gap-3">
            <Link href="/patient-history">
              <Button className="rounded-xl gradient-primary hover-lift">
                Patient History
              </Button>
            </Link>
            <Link href="/all-patient-histories">
              <Button className="rounded-xl gradient-primary hover-lift bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                View All Patient Histories
              </Button>
            </Link>
          </div>
        </div>
        <PatientManagement />
      </div>
    </DashboardLayout>
  )
}