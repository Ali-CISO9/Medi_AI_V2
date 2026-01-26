"use client"

import { Activity, AlertCircle, CheckCircle2, TrendingUp, Stethoscope, User, Save, Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAnalysis } from "@/lib/analysis-context"
import { useState, useEffect, useRef } from "react"
import { toast } from 'sonner'

export function AiAnalysisResult() {
  const { result, input, analysisOrder, reset, resetAll } = useAnalysis()
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    showHepatitis: true,
    showCancer: true,
    showFattyLiver: true
  })

  // Function to expand medical abbreviations
  const expandDiagnosis = (diagnosis: string) => {
    if (diagnosis.toUpperCase() === 'NAFLD') {
      return 'NAFLD (Non-Alcoholic Fatty Liver Disease)'
    }
    return diagnosis
  }
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    patientId: '',
    birthDate: '',
    email: '',
    phone: '',
    profilePicture: null as File | null,
    profilePictureUrl: '',
    doctorName: '',
    analysisDate: new Date().toISOString().split('T')[0],
    analysisTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
  })
  const [isSaving, setIsSaving] = useState(false)

  // Reset patient form when result changes (new analysis)
  useEffect(() => {
    if (result) {
      setPatientInfo({
        name: '',
        patientId: '',
        birthDate: '',
        email: '',
        phone: '',
        profilePicture: null,
        profilePictureUrl: '',
        doctorName: '',
        analysisDate: new Date().toISOString().split('T')[0],
        analysisTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
      })
    }
  }, [result])



  const handleReset = () => {
    // Reset analysis context
    resetAll()

    // Reset filter options
    setFilterOptions({
      showHepatitis: true,
      showCancer: true,
      showFattyLiver: true
    })

    // Show success message
    toast.success("Analysis Reset", {
      description: "All analysis results and inputs have been cleared. You can now start a new analysis."
    })
  }

  const toggleFilter = (filter: keyof typeof filterOptions) => {
    setFilterOptions(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }))
  }

  const getRiskColor = (risk: number, type: 'hepatitis' | 'cancer' | 'fattyLiver') => {
    if (type === 'cancer') {
      if (risk <= 10) return "bg-green-100 text-green-800 border-green-200"
      if (risk <= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200"
      if (risk <= 50) return "bg-orange-100 text-orange-800 border-orange-200"
      return "bg-red-100 text-red-800 border-red-200"
    } else {
      if (risk >= 80) return "bg-green-100 text-green-800 border-green-200"
      if (risk >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
      return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const getHepatitisStageColor = (stage: number) => {
    if (stage === 0 || stage === 1) return "bg-green-100 text-green-800 border-green-200"
    if (stage === 2) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200" // Stage 3 or 4
  }

  const getRiskIcon = (risk: number, type: 'hepatitis' | 'cancer' | 'fattyLiver') => {
    if (type === 'cancer') {
      if (risk <= 10) return <CheckCircle2 className="h-4 w-4 text-green-600" />
      if (risk <= 40) return <AlertCircle className="h-4 w-4 text-yellow-600" />
      return <AlertCircle className="h-4 w-4 text-red-600" />
    } else {
      if (risk >= 80) return <CheckCircle2 className="h-4 w-4 text-green-600" />
      if (risk >= 60) return <AlertCircle className="h-4 w-4 text-yellow-600" />
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getFattyLiverStatusIcon = (diagnosis: string) => {
    if (diagnosis.toLowerCase().includes('healthy')) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    } else {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getFattyLiverStatusColor = (diagnosis: string) => {
    if (diagnosis.toLowerCase().includes('healthy')) {
      return "bg-green-100 text-green-800 border-green-200"
    } else {
      return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const handleSavePatientReport = async () => {
    if (!result) return

    // Validate required fields
    if (!patientInfo.name || !patientInfo.patientId) {
      toast.error("Patient Information Required", {
        description: "Please fill in at least the patient name and patient ID.",
      })
      return
    }

    setIsSaving(true)

    try {
      // Handle profile picture upload
      let profilePictureUrl = patientInfo.profilePictureUrl;
      if (patientInfo.profilePicture) {
        try {
          // Convert file to base64 for storage
          const reader = new FileReader();
          profilePictureUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(patientInfo.profilePicture as Blob);
          });
          console.log('Profile picture converted to base64, length:', profilePictureUrl.length);
        } catch (error) {
          console.error('Error converting profile picture:', error);
          toast.error('Failed to process profile picture');
          return;
        }
      }

      // First, create or get patient
      const patientData = {
        name: patientInfo.name,
        birth_date: patientInfo.birthDate,
        patient_id: patientInfo.patientId,
        email: patientInfo.email,
        phone: patientInfo.phone,
        profile_picture: profilePictureUrl,
        doctor_name: patientInfo.doctorName,
      }
      let patientId;
      try {
        const patientResponse = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData),
        })
        if (!patientResponse.ok) {
          const errorData = await patientResponse.json()
          throw new Error(errorData.error || 'Failed to save patient information')
        }
        const patientResult = await patientResponse.json()
        patientId = patientResult.patient.id
      } catch (error) {
        if (error instanceof Error && error.message.includes('ID already exists')) {
          // Fetch existing patient
          const getResponse = await fetch(`/api/patients?patient_id=${patientInfo.patientId}`)
          if (!getResponse.ok) {
            throw new Error('Failed to fetch existing patient')
          }
          const getData = await getResponse.json()
          if (getData.patients && getData.patients.length > 0) {
            patientId = getData.patients[0].id
          } else {
            throw error
          }
        } else {
          throw error
        }
      }

      // Construct diagnosis, confidence, advice for multi-model sick cases
      let diagnosis = result.diagnosis;
      let confidence = result.confidence;
      let advice = result.advice;
      if (isMultiModelResult && (result as any).gate_prediction === 0) {
        diagnosis = diagnosis || "Complex Liver Disease Analysis";
        confidence = confidence || 85;
        advice = advice || "Multiple liver conditions detected. See detailed results for specific recommendations.";
      }

      // Now save the report directly
      const reportResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          diagnosis: diagnosis,
          confidence: confidence,
          advice: advice,
          risk_level: (result as any).risk_level || 'medium',
          detailed_results: result.results,
        }),
      })
      if (!reportResponse.ok) {
        const errorData = await reportResponse.json()
        throw new Error(errorData.error || 'Failed to save report')
      }

      toast.success("Patient Report Saved", {
        description: `Analysis for ${patientInfo.name} has been saved successfully.`,
      })

      setIsPatientFormOpen(false)

      // Reset form
      setPatientInfo({
        name: '',
        patientId: '',
        birthDate: '',
        email: '',
        phone: '',
        profilePicture: null,
        profilePictureUrl: '',
        doctorName: '',
        analysisDate: new Date().toISOString().split('T')[0],
        analysisTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
      })

    } catch (error) {
      console.error('Save error:', error)
      toast.error("Save Failed", {
        description: error instanceof Error ? error.message : "Failed to save patient report.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!result) {
    return (
      <Card className="gradient-card shadow-lg animate-in fade-in-0 duration-500 hover-lift">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="gradient-text text-xl">AI Analysis Result</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Upload an image or enter lab values to see analysis results
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 md:h-40">
          <div className="text-center text-muted-foreground">
            <Stethoscope className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 opacity-50" />
            <p className="text-sm md:text-base">No analysis results yet</p>
            <p className="text-xs md:text-sm text-muted-foreground/60 mt-1">Upload an image or enter lab values to see results</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (confidence >= 60) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  // Check if this is a multi-model analysis result with gate prediction
  const isMultiModelResult = result && 'gate_prediction' in result && 'results' in result

  return (
    <Card className="gradient-card shadow-lg animate-in fade-in-0 duration-500 hover-lift min-h-[400px] md:min-h-[500px]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="gradient-text text-lg md:text-xl">Doctor's Dashboard</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground/80 text-sm md:text-base">
          Comprehensive liver disease assessment with intelligent filtering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {/* General Test Result - Only show for healthy patients */}
        {result && result.gate_prediction === 1 && (
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                General Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Diagnosis:</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {(result as any).diagnosis || 'Healthy'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Confidence:</span>
                  <span className="text-sm">{(result as any).confidence ?? 0}%</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">{((result as any).advice || 'Maintain your current healthy lifestyle.').replace('Gate screening', 'General Test')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isMultiModelResult ? (
          <>
            {/* Filter Toolbar - Only show if Gate detected risk */}
            {(result as any).gate_prediction === 0 && (
              <div className="rounded-xl gradient-card p-4 animate-in slide-in-from-left-4 duration-300 delay-200">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Analysis Filters</h4>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOptions.showHepatitis}
                      onChange={() => toggleFilter('showHepatitis')}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Show Hepatitis</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOptions.showCancer}
                      onChange={() => toggleFilter('showCancer')}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Show Cancer Risk</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOptions.showFattyLiver}
                      onChange={() => toggleFilter('showFattyLiver')}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Show Fatty Liver</span>
                  </label>
                </div>
              </div>
            )}

            {/* Result Stack - Only show if Gate detected risk */}
            {(result as any).gate_prediction === 0 && (
              <div className="space-y-4">
                {analysisOrder.map((analysisType, index) => {
                  // Hepatitis Card
                  if (analysisType === 'hepatitis' && filterOptions.showHepatitis && (result as any).results.hepatitis) {
                    return (
                      <div key="hepatitis" className="rounded-xl gradient-card p-4 md:p-5 animate-in slide-in-from-left-4 duration-300 hover-lift">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
                            <Activity className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold gradient-text">Hepatitis Analysis</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/50">
                                {getRiskIcon((result as any).results.hepatitis.confidence ?? 0, 'hepatitis')}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">Stage {(result as any).results.hepatitis.stage ?? 0} ({(result as any).results.hepatitis.stage_description || 'Unknown'})</p>
                                <p className="text-xs text-muted-foreground">Fibrosis Assessment</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`${getHepatitisStageColor((result as any).results.hepatitis.stage ?? 0)} font-semibold text-xs`}>
                              Stage {(result as any).results.hepatitis.stage ?? 0}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Complications Risk</p>
                              <p className="text-muted-foreground">{(result as any).results.hepatitis.complications_risk ?? 0}%</p>
                            </div>
                            <div>
                              <p className="font-medium">Mortality Risk</p>
                              <p className="text-muted-foreground">{(result as any).results.hepatitis.mortality_risk ?? 0}%</p>
                            </div>
                          </div>
                          <div className="border-t pt-3">
                            <p className="text-xs font-medium mb-2">Liver Function Scores</p>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="font-medium">APRI Score</p>
                                <p className="text-muted-foreground">{((result as any).results.hepatitis.apri_score ?? 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="font-medium">ALBI Score</p>
                                <p className="text-muted-foreground">{((result as any).results.hepatitis.albi_score ?? 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{(result as any).results.hepatitis.advice || "No advice available"}</p>
                        </div>
                      </div>
                    )
                  }

                  // Cancer Risk Card
                  if (analysisType === 'cancer' && filterOptions.showCancer && (result as any).results.cancer) {
                    return (
                      <div key="cancer" className="rounded-xl gradient-card p-4 md:p-5 animate-in slide-in-from-right-4 duration-300 delay-200 hover-lift">
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
                                {getRiskIcon((result as any).results.cancer.risk_percentage ?? 0, 'cancer')}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">Risk Level: {((result as any).results.cancer.risk_percentage ?? 0).toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">5-Tier Assessment</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`${getRiskColor((result as any).results.cancer.risk_percentage ?? 0, 'cancer')} font-semibold text-xs`}>
                              {((result as any).results.cancer.risk_percentage ?? 0).toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{(result as any).results.cancer.advice || "No advice available"}</p>
                        </div>
                      </div>
                    )
                  }

                  // Fatty Liver Card
                  if (analysisType === 'fatty_liver' && filterOptions.showFattyLiver && (result as any).results.fatty_liver) {
                    return (
                      <div key="fatty_liver" className="rounded-xl gradient-card p-4 md:p-5 animate-in slide-in-from-bottom-4 duration-300 delay-400 hover-lift">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
                            <TrendingUp className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold gradient-text">Fatty Liver Analysis</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/50">
                                {getFattyLiverStatusIcon((result as any).results.fatty_liver.diagnosis || '')}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{(result as any).results.fatty_liver.diagnosis || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">Injury Confidence: {((result as any).results.fatty_liver.confidence ?? 0).toFixed(1)}%</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`${getFattyLiverStatusColor((result as any).results.fatty_liver.diagnosis)} font-semibold text-xs`}>
                              {((result as any).results.fatty_liver.confidence ?? 0).toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{(result as any).results.fatty_liver.advice || "No advice available"}</p>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </>
        ) : (
          /* Legacy Single Result Display */
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl gradient-card p-3 md:p-4 animate-in slide-in-from-left-4 duration-300 hover-lift gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/50" aria-hidden="true">
                  {getStatusIcon(result.confidence ?? 0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm md:text-base">{expandDiagnosis(result.diagnosis ?? '')}</p>
                  <p className="text-xs text-muted-foreground">Confidence: {result.confidence ?? 0}%</p>
                </div>
              </div>
              <Badge variant="outline" className={`${getStatusColor(result.confidence ?? 0)} font-semibold text-xs md:text-sm`}>
                {result.confidence ?? 0}%
              </Badge>
            </div>

            <div className="mt-4 md:mt-6 rounded-xl gradient-card p-4 md:p-5 animate-in fade-in-0 duration-500 delay-500 hover-lift">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl gradient-primary animate-glow" aria-hidden="true">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-base md:text-lg font-semibold gradient-text mb-2">Medical Advice</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {result.advice}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setIsPatientFormOpen(true)}
            className="gradient-primary hover-lift"
          >
            <User className="h-4 w-4 mr-2" />
            Link to Patient & Save
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            className="gradient-card hover-lift border-red-200 hover:border-red-400 text-red-600 hover:text-red-700"
          >
            <div className="h-4 w-4 mr-2 rounded-full border-2 border-red-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            Reset
          </Button>


          {/* Patient Information Form Dialog */}
          <Dialog open={isPatientFormOpen} onOpenChange={setIsPatientFormOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Link Analysis to Patient
                </DialogTitle>
                <DialogDescription>
                  Associate this AI analysis with a patient record and save to database
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-name">Patient Name *</Label>
                    <Input
                      id="patient-name"
                      value={patientInfo.name}
                      onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                      placeholder="Enter patient full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patient-id">Patient ID *</Label>
                    <Input
                      id="patient-id"
                      value={patientInfo.patientId}
                      onChange={(e) => setPatientInfo({ ...patientInfo, patientId: e.target.value })}
                      placeholder="P-2024-XXX"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth-date">Birth Date</Label>
                    <Input
                      id="birth-date"
                      type="date"
                      value={patientInfo.birthDate}
                      onChange={(e) => setPatientInfo({ ...patientInfo, birthDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={patientInfo.email}
                      onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                      placeholder="patient@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={patientInfo.phone}
                      onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctor-name">Doctor Name</Label>
                    <Input
                      id="doctor-name"
                      value={patientInfo.doctorName}
                      onChange={(e) => setPatientInfo({ ...patientInfo, doctorName: e.target.value })}
                      placeholder="Attending physician"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="analysis-date">Analysis Date</Label>
                    <Input
                      id="analysis-date"
                      type="date"
                      value={patientInfo.analysisDate}
                      onChange={(e) => setPatientInfo({ ...patientInfo, analysisDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profile-picture">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            // Create preview URL for the selected file
                            const previewUrl = URL.createObjectURL(file);
                            setPatientInfo({ ...patientInfo, profilePicture: file, profilePictureUrl: previewUrl });
                          } else {
                            setPatientInfo({ ...patientInfo, profilePicture: null });
                          }
                        }}
                        className="flex-1"
                      />
                      {patientInfo.profilePictureUrl && (
                        <img
                          src={patientInfo.profilePictureUrl}
                          alt="Profile preview"
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="analysis-time">Analysis Time</Label>
                    <Input
                      id="analysis-time"
                      type="time"
                      value={patientInfo.analysisTime}
                      onChange={(e) => setPatientInfo({ ...patientInfo, analysisTime: e.target.value })}
                    />
                  </div>
                </div>

              </div>

              <Separator className="my-4" />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPatientFormOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePatientReport}
                  disabled={isSaving || !patientInfo.name || !patientInfo.patientId}
                  className="gradient-primary"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Patient Report
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
