"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
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
  Stethoscope,
  Activity,
  Trash2
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
  detailed_results?: string
}

export function MedicalRecords() {
  // Use the patient context for shared state management
  const { refreshAllData } = usePatients()

  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [diagnosisFilter, setDiagnosisFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Analysis detail modal state
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'cancer' | 'hepatitis' | 'fatty_liver' | 'general', data: any } | null>(null)

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

    // Diagnosis filter
    if (diagnosisFilter !== "all") {
      filtered = filtered.filter(record => {
        if (!record.detailed_results || Object.keys(JSON.parse(record.detailed_results || '{}')).length === 0) {
          // Records without detailed results are "General"
          return diagnosisFilter === "general"
        } else {
          // Records with detailed results have badges based on the keys
          const details = JSON.parse(record.detailed_results)
          return Object.keys(details).includes(diagnosisFilter) || (diagnosisFilter === "general")
        }
      })
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
  }, [records, searchTerm, diagnosisFilter, dateFrom, dateTo])

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
    setDiagnosisFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  const viewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setIsDetailOpen(true)
  }

  const restorePatient = async (record: MedicalRecord) => {
    console.log("Restoring Patient ID:", record.patient_id)

    try {
      const response = await fetch(`/api/patients/${record.patient_id}/restore`, {
        method: 'PUT',
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

  const deletePatient = async (record: MedicalRecord) => {
    if (!confirm(`Are you sure you want to permanently delete patient "${record.patient_name}" and all their analyses? This action cannot be undone.`)) {
      return
    }

    console.log("Deleting Patient ID:", record.patient_id)

    try {
      const response = await fetch(`/api/patients/${record.patient_id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from current list immediately for better UX
        setRecords(prev => prev.filter(r => r.id !== record.id))
        setFilteredRecords(prev => prev.filter(r => r.id !== record.id))

        // Refresh shared data so other components get updated
        await refreshAllData()

        toast.success('Patient and all analyses permanently deleted')
      } else {
        toast.error('Failed to delete patient')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('Error deleting patient')
    }
  }

  const renderDiagnosticBadges = (record: MedicalRecord) => {
    if (!record.detailed_results || Object.keys(JSON.parse(record.detailed_results || '{}')).length === 0) {
      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            {record.confidence >= 80 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : record.confidence >= 60 ? (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <Badge variant="outline" className={
              record.confidence >= 80 ? "bg-green-100 text-green-800 border-green-200 text-xs" :
              record.confidence >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200 text-xs" :
              "bg-red-100 text-red-800 border-red-200 text-xs"
            }>
              {record.confidence}% confidence
            </Badge>
          </div>
          <p className="text-xs font-medium text-foreground mb-1">Diagnosis: {record.diagnosis}</p>
          <p className="text-xs text-muted-foreground mb-2">Advice: {record.advice}</p>
          <p className="text-xs text-muted-foreground">
            Last Updated: {record.updated_at ? new Date(record.updated_at).toLocaleDateString() : 'N/A'} at{' '}
            {record.updated_at ? new Date(new Date(record.updated_at).getTime() + (3 * 60 * 60 * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
          </p>
        </div>
      );
    }
    // Render badges for sick cases
    const details = JSON.parse(record.detailed_results);
    return (
      <div>
        <div className="flex flex-wrap gap-1 mb-2">
          {/* General badge for overall result */}
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs cursor-pointer hover:opacity-80"
            onClick={() => setSelectedDetail({ type: 'general', data: { diagnosis: record.diagnosis, confidence: record.confidence, advice: record.advice } })}
          >
            General
          </Badge>
          {Object.keys(details).map(key => (
            <Badge
              key={key}
              variant="outline"
              className={
                key === 'cancer' ? "bg-red-100 text-red-800 border-red-200 text-xs cursor-pointer hover:opacity-80" :
                key === 'hepatitis' ? "bg-blue-100 text-blue-800 border-blue-200 text-xs cursor-pointer hover:opacity-80" :
                key === 'fatty_liver' ? "bg-green-100 text-green-800 border-green-200 text-xs cursor-pointer hover:opacity-80" :
                "bg-gray-100 text-gray-800 border-gray-200 text-xs cursor-pointer hover:opacity-80"
              }
              onClick={() => setSelectedDetail({ type: key as 'cancer' | 'hepatitis' | 'fatty_liver', data: details[key] })}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Last Updated: {record.updated_at ? new Date(record.updated_at).toLocaleDateString() : 'N/A'} at{' '}
          {record.updated_at ? new Date(new Date(record.updated_at).getTime() + (3 * 60 * 60 * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
        </p>
      </div>
    );
  };

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

            {/* Diagnosis Filter */}
            <div className="space-y-2">
              <Label htmlFor="diagnosis-filter">Diagnosis</Label>
              <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All diagnoses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Diagnoses</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="cancer">Cancer</SelectItem>
                  <SelectItem value="fatty_liver">Fatty Liver</SelectItem>
                  <SelectItem value="hepatitis">Hepatitis</SelectItem>
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
            {searchTerm || diagnosisFilter !== "all" || dateFrom || dateTo ? (
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
              {(searchTerm || diagnosisFilter !== "all" || dateFrom || dateTo) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Scrollable container that only appears when there are more than 5 records */}
              <div className={filteredRecords.length > 5 ? "overflow-y-auto max-h-[400px] pr-2" : ""}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-semibold">Patient Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Medical ID</th>
                      <th className="text-left py-3 px-4 font-semibold">AI Prediction</th>
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
                            {record.profile_picture ? (
                              <img src={record.profile_picture} alt={record.patient_name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {record.patient_name[0].toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium">{record.patient_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {record.patient_id_display}
                        </td>
                        <td className="py-3 px-4">
                          {renderDiagnosticBadges(record)}
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deletePatient(record)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><strong>Name:</strong> {selectedRecord.patient_name}</div>
                  <div><strong>ID:</strong> {selectedRecord.patient_id_display}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Contacts:</span>
                    <div className="mt-1 text-sm">
                      <div>{selectedRecord.email ? `📧 ${selectedRecord.email}` : 'Not provided'}</div>
                      <div>{selectedRecord.phone ? `📱 ${selectedRecord.phone}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Record Date:</span>
                    <span className="mt-1 text-sm">
                      {new Date(selectedRecord.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
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

      {/* Analysis Detail Dialog */}
      <Dialog open={!!selectedDetail} onOpenChange={() => setSelectedDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              {selectedDetail?.type === 'general' && 'General Test Result'}
              {selectedDetail?.type === 'cancer' && 'Cancer Risk Assessment'}
              {selectedDetail?.type === 'hepatitis' && 'Hepatitis Analysis'}
              {selectedDetail?.type === 'fatty_liver' && 'Fatty Liver Analysis'}
            </DialogTitle>
            <DialogDescription>
              Detailed analysis results for {selectedDetail?.type?.replace('_', ' ')}
            </DialogDescription>
          </DialogHeader>

          {selectedDetail && (
            <div className="space-y-4">
              {selectedDetail.type === 'general' && (
                <div className="rounded-xl gradient-card p-4 md:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
                      <Activity className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold gradient-text">General Test Result</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Diagnosis:</span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Potential Risk Detected
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Confidence:</span>
                      <span className="text-sm">{selectedDetail.data.confidence ?? 0}%</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">General Test indicates potential liver disease risk. Detailed analysis recommended for accurate diagnosis.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedDetail.type === 'hepatitis' && (() => {
                const riskLevel = selectedDetail.data.risk_level || 'low';
                
                const getHepatitisRiskColor = (level: string) => {
                  if (level === 'critical') return "bg-red-100 text-red-800 border-red-200";
                  if (level === 'high') return "bg-yellow-100 text-yellow-800 border-yellow-200";
                  return "bg-green-100 text-green-800 border-green-200";
                };
                
                const getHepatitisRiskIconColor = (level: string) => {
                  if (level === 'critical') return "text-red-600";
                  if (level === 'high') return "text-yellow-600";
                  return "text-green-600";
                };

                return (
                  <div className="rounded-xl gradient-card p-4 md:p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getHepatitisRiskColor(riskLevel)} animate-glow`}>
                        <Activity className={`h-4 w-4 ${getHepatitisRiskIconColor(riskLevel)}`} />
                      </div>
                      <h3 className="text-lg font-semibold gradient-text">Hepatitis Analysis</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${getHepatitisRiskColor(riskLevel)}`}>
                            {riskLevel === 'critical' ? <AlertCircle className="h-4 w-4 text-red-600" /> :
                             riskLevel === 'high' ? <AlertCircle className="h-4 w-4 text-yellow-600" /> :
                             <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Stage {selectedDetail.data.stage ?? 0} ({selectedDetail.data.stage_description || 'Unknown'})</p>
                            <p className="text-xs text-muted-foreground">Fibrosis Assessment</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${getHepatitisRiskColor(riskLevel)} font-semibold text-xs`}>
                          Stage {selectedDetail.data.stage ?? 0}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Complications Risk</p>
                          <p className="text-muted-foreground">{selectedDetail.data.complications_risk ?? 0}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Survival Risk</p>
                          <p className="text-muted-foreground">{selectedDetail.data.mortality_risk ?? 0}%</p>
                        </div>
                      </div>
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium mb-2">Liver Function Scores</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-medium">APRI Score</p>
                            <p className="text-muted-foreground">{(selectedDetail.data.apri_score ?? 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="font-medium">ALBI Score</p>
                            <p className="text-muted-foreground">{(selectedDetail.data.albi_score ?? 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedDetail.data.advice || "No advice available"}</p>
                    </div>
                  </div>
                );
              })()}

              {selectedDetail.type === 'cancer' && (
                <div className="rounded-xl gradient-card p-4 md:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
                      <Stethoscope className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold gradient-text">Cancer Risk Assessment</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/50">
                          {selectedDetail.data.risk_percentage <= 10 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                            selectedDetail.data.risk_percentage <= 40 ? <AlertCircle className="h-4 w-4 text-yellow-600" /> :
                            selectedDetail.data.risk_percentage <= 50 ? <AlertCircle className="h-4 w-4 text-orange-600" /> :
                            <AlertCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Risk Level: {selectedDetail.data.risk_percentage?.toFixed(1) ?? 0}%</p>
                          <p className="text-xs text-muted-foreground">5-Tier Assessment</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        selectedDetail.data.risk_percentage <= 10 ? "bg-green-100 text-green-800 border-green-200" :
                        selectedDetail.data.risk_percentage <= 40 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                        selectedDetail.data.risk_percentage <= 50 ? "bg-orange-100 text-orange-800 border-orange-200" :
                        "bg-red-100 text-red-800 border-red-200"
                      } style={{ fontWeight: 'bold', fontSize: '12px' }}>
                        {selectedDetail.data.risk_percentage?.toFixed(1) ?? 0}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedDetail.data.advice || "No advice available"}</p>
                  </div>
                </div>
              )}

              {selectedDetail.type === 'fatty_liver' && (
                <div className="rounded-xl gradient-card p-4 md:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
                      <Activity className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold gradient-text">Fatty Liver Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/50">
                          {selectedDetail.data.confidence >= 80 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                            selectedDetail.data.confidence >= 60 ? <AlertCircle className="h-4 w-4 text-yellow-600" /> :
                            <AlertCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{selectedDetail.data.diagnosis || 'Fatty Liver Assessment'}</p>
                          <p className="text-xs text-muted-foreground">Risk Assessment</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        selectedDetail.data.confidence <= 30 ? "bg-green-100 text-green-800 border-green-200" :
                        selectedDetail.data.confidence <= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                        "bg-red-100 text-red-800 border-red-200"
                      } style={{ fontWeight: 'bold', fontSize: '12px' }}>
                        {(selectedDetail.data.confidence ?? 0).toFixed(1)}% Risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Injury Confidence</p>
                        <p className="text-muted-foreground">{(selectedDetail.data.confidence ?? 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="font-medium">Status</p>
                        <p className="text-muted-foreground">{selectedDetail.data.has_fatty_liver ? 'Detected' : 'Not Detected'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedDetail.data.advice || "No advice available"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedDetail(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}