"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ClipboardList,
  Search,
  Filter,
  Calendar as CalendarIcon,
  FileText,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  User,
  Stethoscope
} from "lucide-react"
import { format } from "date-fns"
import { usePatients } from "@/lib/analysis-context"
import { toast } from "sonner"

interface MedicalRecord {
  id: number
  patient_id: number
  diagnosis: string
  confidence: number
  advice: string
  status: string
  is_finalized: boolean
  risk_level: string
  created_at: string
  updated_at: string
  patient_name: string
  patient_id_display: string
  birth_date?: string
  email?: string
  phone?: string
  profile_picture?: string
  department?: string
  doctor_name?: string
}

export function MedicalRecords() {
  // Use the patient context for shared state management
  const { refreshAllData } = usePatients()

  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Fetch archived patients with their analyses
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        // Fetch archived patients
        const patientsResponse = await fetch('/api/patients?status=archived')
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json()
          const archivedPatients = patientsData.patients || []

          // For each archived patient, fetch their archived analyses
          const recordsWithAnalyses = []
          for (const patient of archivedPatients) {
            try {
              // Fetch analyses for this patient that are archived
              const analysesResponse = await fetch(`/api/patient-analyses?patient_id=${patient.patient_id}&include_archived=true`)
              if (analysesResponse.ok) {
                const analysesData = await analysesResponse.json()
                const patientArchivedAnalyses = analysesData.analyses.filter((analysis: any) => analysis.status === 'archived')

                // Create records for each archived analysis of this patient
                for (const analysis of patientArchivedAnalyses) {
                  recordsWithAnalyses.push({
                    ...analysis,
                    patient_name: patient.name,
                    patient_id_display: patient.patient_id,
                    birth_date: patient.birth_date,
                    email: patient.email,
                    phone: patient.phone,
                    profile_picture: patient.profile_picture,
                    department: patient.department,
                    doctor_name: patient.doctor_name,
                  })
                }
              }
            } catch (error) {
              console.error(`Error fetching analyses for patient ${patient.patient_id}:`, error)
            }
          }

          setRecords(recordsWithAnalyses)
          setFilteredRecords(recordsWithAnalyses)
        }
      } catch (error) {
        console.error('Error fetching archived patients:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecords()
  }, [])

  // Filter records based on search and filters
  useEffect(() => {
    let filtered = records

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(record =>
        record.patient_name.toLowerCase().includes(searchLower) ||
        record.patient_id_display.toLowerCase().includes(searchLower)
      )
    }

    // Risk level filter
    if (riskFilter !== "all") {
      filtered = filtered.filter(record => (record.risk_level || 'medium') === riskFilter)
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter(record =>
        new Date(record.created_at) >= fromDate
      )
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(record =>
        new Date(record.created_at) <= toDate
      )
    }

    setFilteredRecords(filtered)
  }, [records, searchTerm, riskFilter, dateFrom, dateTo])

  const getRiskColor = (riskLevel: string | undefined) => {
    const level = riskLevel || 'medium'
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRiskIcon = (riskLevel: string | undefined) => {
    const level = riskLevel || 'medium'
    switch (level) {
      case "high":
        return <AlertCircle className="h-3 w-3" />
      case "medium":
        return <AlertCircle className="h-3 w-3" />
      case "low":
        return <CheckCircle2 className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setRiskFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  const viewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setIsDetailOpen(true)
  }

  const restorePatient = async (record: MedicalRecord) => {
    try {
      const response = await fetch(`/api/patients/${record.patient_id_display}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      })

      if (response.ok) {
        const result = await response.json()

        // Remove from current list immediately for better UX
        setRecords(prev => prev.filter(r => r.id !== record.id))
        setFilteredRecords(prev => prev.filter(r => r.id !== record.id))

        // Refresh shared data so other components get updated
        await refreshAllData()

        // Also refresh the archived analyses list to ensure it's up to date
        const refreshResponse = await fetch('/api/patient-analyses?include_archived=true')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          const archivedAnalyses = data.analyses.filter((analysis: any) => analysis.status === 'archived')
          setRecords(archivedAnalyses)
          setFilteredRecords(archivedAnalyses)
        }

        toast.success(result.message || 'Patient restored to active status')
      } else {
        toast.error('Failed to restore patient')
      }
    } catch (error) {
      console.error('Error restoring patient:', error)
      toast.error('Error restoring patient')
    }
  }

  if (isLoading) {
    return (
      <Card className="gradient-card shadow-lg">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading medical records...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="gradient-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="gradient-text text-xl">Medical Records</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Historical repository of completed patient cases and finalized medical reports
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="gradient-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Patient name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Risk Level Filter */}
            <div className="space-y-2">
              <Label htmlFor="risk-filter">Risk Level</Label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All risks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="gradient-card"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="gradient-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Medical Records ({filteredRecords.length})</span>
            {searchTerm || riskFilter !== "all" || dateFrom || dateTo ? (
              <Badge variant="secondary">
                Filtered Results
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {records.length === 0 ? "No Medical Records Found" : "No Records Match Your Filters"}
              </h3>
              <p className="text-muted-foreground/60 mb-4">
                {records.length === 0
                  ? "Medical records will appear here once patient cases are finalized."
                  : "Try adjusting your search terms or filters to find more records."
                }
              </p>
              {(searchTerm || riskFilter !== "all" || dateFrom || dateTo) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 font-semibold">Patient Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Medical ID</th>
                    <th className="text-left py-3 px-4 font-semibold">AI Prediction</th>
                    <th className="text-left py-3 px-4 font-semibold">Risk Level</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Contacts</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {record.patient_name[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{record.patient_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {record.patient_id_display}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate" title={record.diagnosis}>
                          {record.diagnosis}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={getRiskColor(record.risk_level || 'medium')}>
                          <span className="flex items-center gap-1">
                            {getRiskIcon(record.risk_level || 'medium')}
                            {(record.risk_level || 'medium').toUpperCase()}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(record.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-1">
                          {record.email && (
                            <p className="text-xs text-muted-foreground">📧 {record.email}</p>
                          )}
                          {record.phone && (
                            <p className="text-xs text-muted-foreground">📱 {record.phone}</p>
                          )}
                          {!record.email && !record.phone && (
                            <p className="text-xs text-muted-foreground text-center">-</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewRecord(record)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restorePatient(record)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            Restore
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Medical Record Details
            </DialogTitle>
            <DialogDescription>
              Detailed information for archived patient record
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {selectedRecord.patient_name}</div>
                  <div><strong>ID:</strong> {selectedRecord.patient_id_display}</div>
                  <div><strong>Department:</strong> {selectedRecord.department || 'Not specified'}</div>
                  <div><strong>Contacts:</strong></div>
                  <div><strong>Record Date:</strong> {format(new Date(selectedRecord.created_at), 'PPP')}</div>
                  <div><strong>Risk Level:</strong>
                    <Badge variant="outline" className={`${getRiskColor(selectedRecord.risk_level)} ml-2`}>
                      {(selectedRecord.risk_level || 'medium').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <div className="ml-0">
                    {selectedRecord.email && <div>📧 {selectedRecord.email}</div>}
                    {selectedRecord.phone && <div>📱 {selectedRecord.phone}</div>}
                    {!selectedRecord.email && !selectedRecord.phone && <div className="text-muted-foreground">Not provided</div>}
                  </div>
                </div>
              </div>

              {/* Diagnosis & Confidence */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">AI Analysis Results</h3>
                <div className="space-y-3">
                  <div>
                    <strong>Diagnosis:</strong> {selectedRecord.diagnosis}
                  </div>
                  <div>
                    <strong>Confidence:</strong> {selectedRecord.confidence}%
                  </div>
                  <div>
                    <strong>Medical Advice:</strong> {selectedRecord.advice}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <strong>Status:</strong> Archived Patient Record (Read-Only)
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => selectedRecord && restorePatient(selectedRecord)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    Restore to Active
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}