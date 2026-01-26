"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FileImage, Loader2, CheckCircle2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from 'sonner'
import { useAnalysis } from "@/lib/analysis-context"
import { HepatitisInput } from "@/components/hepatitis-input"


export function AiRadiologyScan() {
  const { setResult, setInput, setAnalysisOrder, result } = useAnalysis()
  const [isUploading, setIsUploading] = useState(false)
  const [gateResult, setGateResult] = useState<any>(null)
  const [gateExpanded, setGateExpanded] = useState(true)
  const [isEditingParameters, setIsEditingParameters] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("cancer")
  const [hepatitisPresetData, setHepatitisPresetData] = useState<Record<string, string> | undefined>()

  // Tab configuration with theme properties
  const tabConfig = [
    {
      value: "cancer",
      label: "Cancer Risk",
      activeTextColor: "#dc2626", // red-600
      activeBackgroundColor: "#fef2f2", // red-50
    },
    {
      value: "hepatitis",
      label: "Hepatitis C",
      activeTextColor: "#2563eb", // blue-600
      activeBackgroundColor: "#eff6ff", // blue-50
    },
    {
      value: "fatty",
      label: "Fatty Liver",
      activeTextColor: "#16a34a", // green-600
      activeBackgroundColor: "#f0fdf4", // green-50
    },
  ]

  // Get active tab configuration
  const activeTabConfig = tabConfig.find(tab => tab.value === activeTab)

  const [manualValues, setManualValues] = useState<Record<string, string>>({
    // Group A: Patient Demographics & History
    age: '',
    gender: '',
    bmi: '',
    smoking: '',
    alcohol: '',
    activity: '',
    genetic_risk: '',
    cancer_history: '',

    // Group B: Clinical Signs (Physical Exam)
    ascites: '',
    hepatomegaly: '',
    spiders: '',
    edema: '',

    // Group C: Comprehensive Lab Panel
    bilirubin: '',
    bilirubin_direct: '',
    cholesterol: '',
    albumin: '',
    copper: '',
    alp: '',
    alt: '',
    ast: '',
    total_proteins: '',
    ag_ratio: '',
    platelets: '',
    prothrombin: '',
    creatinine: '',
    glucose: '',
    ggt: '',
    triglycerides: '',
    uric_acid: '',
    hdl: '',
  })

  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldNames, setFieldNames] = useState<Record<string, string>>({
    // Group A: Patient Demographics & History
    age: 'Age',
    gender: 'Gender',
    bmi: 'BMI',
    smoking: 'Smoking',
    alcohol: 'Alcohol Consumption',
    activity: 'Physical Activity',
    genetic_risk: 'Genetic Risk',
    cancer_history: 'Cancer History',

    // Group B: Clinical Signs (Physical Exam)
    ascites: 'Ascites',
    hepatomegaly: 'Hepatomegaly',
    spiders: 'Spider Angiomas',
    edema: 'Edema',

    // Group C: Comprehensive Lab Panel
    bilirubin: 'Total Bilirubin',
    bilirubin_direct: 'Direct Bilirubin',
    cholesterol: 'Cholesterol',
    albumin: 'Albumin',
    copper: 'Copper',
    alp: 'ALP',
    alt: 'ALT',
    ast: 'AST',
    total_proteins: 'Total Proteins',
    ag_ratio: 'Albumin/Globulin Ratio',
    platelets: 'Platelets',
    prothrombin: 'Prothrombin Time',
    creatinine: 'Creatinine',
    glucose: 'Glucose',
    ggt: 'GGT',
    triglycerides: 'Triglycerides',
    uric_acid: 'Uric Acid',
    hdl: 'HDL',
  })

  // Reset component state when analysis result is cleared
  useEffect(() => {
    if (result === null) {
      setGateResult(null)
      setGateExpanded(true)
      setManualValues({
        // Group A: Patient Demographics & History
        age: '',
        gender: '',
        bmi: '',
        smoking: '',
        alcohol: '',
        activity: '',
        genetic_risk: '',
        cancer_history: '',

        // Group B: Clinical Signs (Physical Exam)
        ascites: '',
        hepatomegaly: '',
        spiders: '',
        edema: '',

        // Group C: Comprehensive Lab Panel
        bilirubin: '',
        bilirubin_direct: '',
        cholesterol: '',
        albumin: '',
        copper: '',
        alp: '',
        alt: '',
        ast: '',
        total_proteins: '',
        ag_ratio: '',
        platelets: '',
        prothrombin: '',
        creatinine: '',
        glucose: '',
        ggt: '',
        triglycerides: '',
        uric_acid: '',
        hdl: '',
      })
    }
  }, [result])

  // Field metadata for better UX
  const fieldMetadata: Record<string, { unit: string; range: string; description: string }> = {
    // Group A: Patient Demographics & History
    age: { unit: 'years', range: '1-120', description: 'Patient Age' },
    gender: { unit: '', range: '', description: 'Patient Gender' },
    bmi: { unit: 'kg/m²', range: '18.5-24.9', description: 'Body Mass Index' },
    smoking: { unit: '', range: '', description: 'Smoking Status' },
    alcohol: { unit: '', range: '', description: 'Alcohol Consumption' },
    activity: { unit: '', range: '', description: 'Physical Activity Level' },
    genetic_risk: { unit: '', range: '', description: 'Genetic Risk Level' },
    cancer_history: { unit: '', range: '', description: 'Family Cancer History' },

    // Group B: Clinical Signs (Physical Exam)
    ascites: { unit: '', range: '', description: 'Ascites (fluid accumulation)' },
    hepatomegaly: { unit: '', range: '', description: 'Liver enlargement' },
    spiders: { unit: '', range: '', description: 'Spider angiomas' },
    edema: { unit: '', range: '', description: 'Edema severity' },

    // Group C: Comprehensive Lab Panel
    bilirubin: { unit: 'mg/dL', range: '0.3-1.2', description: 'Total Bilirubin' },
    bilirubin_direct: { unit: 'mg/dL', range: '0.0-0.3', description: 'Direct Bilirubin' },
    cholesterol: { unit: 'mg/dL', range: '<200', description: 'Total Cholesterol' },
    albumin: { unit: 'g/dL', range: '3.5-5.0', description: 'Albumin' },
    copper: { unit: 'µg/dL', range: '70-140', description: 'Serum Copper' },
    alp: { unit: 'IU/L', range: '44-147', description: 'Alkaline Phosphatase' },
    alt: { unit: 'IU/L', range: '7-56', description: 'Alanine Aminotransferase' },
    ast: { unit: 'IU/L', range: '10-40', description: 'Aspartate Aminotransferase' },
    total_proteins: { unit: 'g/dL', range: '6.0-8.5', description: 'Total Proteins' },
    ag_ratio: { unit: '', range: '1.0-2.5', description: 'Albumin/Globulin Ratio' },
    platelets: { unit: '×10³/µL', range: '150-450', description: 'Platelet Count' },
    prothrombin: { unit: 'seconds', range: '11-13', description: 'Prothrombin Time' },
    creatinine: { unit: 'mg/dL', range: '0.7-1.3', description: 'Serum Creatinine' },
    glucose: { unit: 'mg/dL', range: '70-100', description: 'Fasting Glucose' },
    ggt: { unit: 'IU/L', range: '9-48', description: 'Gamma-Glutamyl Transferase' },
    triglycerides: { unit: 'mg/dL', range: '<150', description: 'Triglycerides' },
    uric_acid: { unit: 'mg/dL', range: '3.5-7.2', description: 'Uric Acid' },
    hdl: { unit: 'mg/dL', range: '≥40', description: 'HDL Cholesterol' },
  }



  const handleCancerAnalysis = async () => {
    // Validate required fields
    const requiredFields = ['age', 'gender', 'bmi', 'smoking', 'genetic_risk', 'activity', 'alcohol', 'cancer_history']
    const missingRequired = requiredFields.filter(key => !manualValues[key] || manualValues[key].trim() === '')

    if (missingRequired.length > 0) {
      toast.error("Required Fields Missing", {
        description: `Please fill in: ${missingRequired.join(', ')}`,
      })
      return
    }

    setIsUploading(true)

    try {
      // Construct payload with mode 'cancer' and merge gate + cancer data
      const payload: Record<string, any> = { mode: 'cancer' }

      // Map JavaScript variable names to exact backend snake_case keys
      const keyMapping: Record<string, string> = {
        'age': 'age',
        'gender': 'gender',
        'bmi': 'bmi',
        'smoking': 'smoking',
        'genetic_risk': 'genetic_risk',
        'activity': 'activity',
        'alcohol': 'alcohol',
        'cancer_history': 'cancer_history'
      }

      requiredFields.forEach(key => {
        const backendKey = keyMapping[key] || key
        if (['age', 'bmi'].includes(key)) {
          payload[backendKey] = Number(manualValues[key])
        } else {
          payload[backendKey] = manualValues[key]
        }
      })

      console.log('Sending cancer payload:', payload)

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
        throw new Error(errorData.error || `Backend error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.results && result.results.cancer) {
        // Deep merge the cancer result into analysis state
        setGateResult((prev: any) => ({
          ...prev,
          results: {
            ...prev?.results,
            cancer: result.results.cancer
          }
        }))

        // Update global result for display in right column
        setResult(prev => ({
          ...prev,
          results: {
            ...(prev?.results || {}), // PRESERVE existing siblings
            cancer: result.results.cancer
          }
        }))

        // Update analysis order - move cancer to front
        setAnalysisOrder(prev => ['cancer', ...prev.filter(item => item !== 'cancer')])

        toast.success("Cancer Analysis Complete", {
          description: `Risk Level: ${result.results.cancer.risk_level} (${result.results.cancer.risk_percentage}%)`,
        })
      } else {
        throw new Error(result.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Cancer analysis error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze cancer risk. Please try again."
      toast.error("Cancer Analysis Failed", {
        description: errorMessage,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFattyLiverAnalysis = async () => {
    // Validate required fields
    const requiredFields = ['albumin', 'alp', 'ast', 'alt', 'cholesterol', 'creatinine', 'glucose', 'ggt', 'bilirubin', 'triglycerides', 'uric_acid', 'platelets', 'hdl']
    const missingRequired = requiredFields.filter(key => !manualValues[key] || manualValues[key].trim() === '')

    if (missingRequired.length > 0) {
      toast.error("Required Fields Missing", {
        description: `Please fill in: ${missingRequired.join(', ')}`,
      })
      return
    }

    setIsUploading(true)

    try {
      // Construct payload with mode 'fatty_liver' and merge gate + fatty liver data
      const payload: Record<string, any> = { mode: 'fatty_liver' }

      // Map JavaScript variable names to exact backend snake_case keys
      const keyMapping: Record<string, string> = {
        'albumin': 'albumin',
        'alp': 'alp',
        'ast': 'ast',
        'alt': 'alt',
        'cholesterol': 'cholesterol',
        'creatinine': 'creatinine',
        'glucose': 'glucose',
        'ggt': 'ggt',
        'bilirubin': 'bilirubin',
        'triglycerides': 'triglycerides',
        'uric_acid': 'uric_acid',
        'platelets': 'platelets',
        'hdl': 'hdl'
      }

      requiredFields.forEach(key => {
        const backendKey = keyMapping[key] || key
        payload[backendKey] = Number(manualValues[key])
      })

      console.log('Sending fatty liver payload:', payload)

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
        throw new Error(errorData.error || `Backend error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.results && result.results.fatty_liver) {
        // Deep merge the fatty liver result into analysis state
        setGateResult((prev: any) => ({
          ...prev,
          results: {
            ...prev?.results,
            fatty_liver: result.results.fatty_liver
          }
        }))

        // Update global result for display in right column
        setResult((prev: any) => ({
          ...prev,
          results: {
            ...(prev?.results || {}), // PRESERVE existing siblings
            fatty_liver: result.results.fatty_liver
          }
        }))

        // Update analysis order - move fatty_liver to front
        setAnalysisOrder(prev => ['fatty_liver', ...prev.filter(item => item !== 'fatty_liver')])

        toast.success("Fatty Liver Analysis Complete", {
          description: `${result.results.fatty_liver.diagnosis} (${result.results.fatty_liver.sick_probability}%)`,
        })
      } else {
        throw new Error(result.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Fatty liver analysis error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze fatty liver. Please try again."
      toast.error("Fatty Liver Analysis Failed", {
        description: errorMessage,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualSubmit = async () => {
    // Gate screening only
      // Gate screening validation
      const gateFields = ['age', 'gender', 'bilirubin', 'bilirubin_direct', 'alp', 'alt', 'ast', 'total_proteins', 'albumin', 'ag_ratio']
      const missingRequired = gateFields.filter(key => !manualValues[key] || manualValues[key].trim() === '')

      if (missingRequired.length > 0) {
        toast.error("Required Fields Missing", {
          description: `Please fill in: ${missingRequired.join(', ')}`,
        })
        return
      }

      setIsUploading(true)

      try {
        // Prepare payload with gate parameters using exact backend key names
        const payload: Record<string, any> = { mode: 'gate' }

        // Map JavaScript variable names to exact backend snake_case keys
        const keyMapping: Record<string, string> = {
          'age': 'age',
          'gender': 'gender',
          'bilirubin': 'total_bilirubin',
          'bilirubin_direct': 'direct_bilirubin',
          'alp': 'alkaline_phosphotase',
          'alt': 'alamine_aminotransferase',
          'ast': 'aspartate_aminotransferase',
          'total_proteins': 'total_protiens', // Note: intentional spelling to match backend
          'albumin': 'albumin',
          'ag_ratio': 'albumin_and_globulin_ratio'
        }

        gateFields.forEach(key => {
          const backendKey = keyMapping[key] || key
          if (['age', 'bilirubin', 'bilirubin_direct', 'alp', 'alt', 'ast', 'total_proteins', 'albumin', 'ag_ratio'].includes(key)) {
            payload[backendKey] = Number(manualValues[key])
          } else {
            payload[backendKey] = manualValues[key]
          }
        })

        console.log('Sending gate payload:', payload)

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
          throw new Error(errorData.error || `Backend error: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          setGateResult(result)
          setGateExpanded(false) // Collapse the form after successful analysis
          if (result.diagnosis === 'Healthy') {
            // Healthy - show green card
            setResult({
              gate_prediction: 1,
              diagnosis: result.diagnosis,
              confidence: result.confidence,
              advice: result.advice,
              results: {}
            })
            toast.success("General Test Complete", {
              description: "Patient appears healthy. No further analysis needed.",
            })
          } else {
            // Sick - show detailed analysis tabs
            setResult({
              gate_prediction: 0,
              results: {}
            })
            toast.warning("General Test Complete", {
              description: "Potential risk detected. Detailed analysis available in tabs below.",
            })
          }
        } else {
          throw new Error(result.error || "Analysis failed")
        }
      } catch (error) {
        console.error("Gate analysis error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to analyze patient profile. Please try again."
        toast.error("Analysis Failed", {
          description: errorMessage,
        })
      } finally {
        setIsUploading(false)
      }
  }


  const handlePresetSelect = (presetData: Record<string, string>) => {
    // Define gate screening fields (NEVER change these with presets)
    const gateFields = ['age', 'gender', 'bilirubin', 'bilirubin_direct', 'alp', 'alt', 'ast', 'total_proteins', 'albumin', 'ag_ratio']

    // Define analysis-specific fields (exclude gate fields)
    const cancerFields = ['bmi', 'smoking', 'alcohol', 'activity', 'genetic_risk', 'cancer_history']
    const hepatitisFields = ['platelets', 'prothrombin', 'inr', 'cholesterol', 'triglycerides', 'copper', 'hepatomegaly', 'spiders', 'edema', 'ascites']
    const fattyLiverFields = ['cholesterol', 'creatinine', 'glucose', 'ggt', 'triglycerides', 'uric_acid', 'platelets', 'hdl']

    // Check if patient has active analysis result (diagnosed as "Sick")
    const isSickMode = gateResult && gateResult.diagnosis !== 'Healthy'

    if (isSickMode) {
      // Sick Mode: Fill ONLY analysis-specific fields for the active tab (NEVER touch gate fields)
      let filteredData: Record<string, string> = {}

      if (activeTab === 'cancer') {
        // Only update cancer-specific fields (excluding gate fields)
        cancerFields.forEach(field => {
          if (presetData[field] !== undefined) {
            filteredData[field] = presetData[field]
          }
        })
      } else if (activeTab === 'hepatitis') {
        // Only update hepatitis preset data for the HepatitisInput component
        hepatitisFields.forEach(field => {
          if (presetData[field] !== undefined) {
            filteredData[field] = presetData[field]
          }
        })
        setHepatitisPresetData(filteredData)
        return // Don't update manualValues for hepatitis, it uses its own state
      } else if (activeTab === 'fatty') {
        // Only update fatty liver-specific fields (excluding gate fields)
        fattyLiverFields.forEach(field => {
          if (presetData[field] !== undefined) {
            filteredData[field] = presetData[field]
          }
        })
      }

      setManualValues(prev => ({ ...prev, ...filteredData }))
    } else {
      // Fresh Mode: Fill ONLY the Gate Inputs
      // Filter to include only gate fields
      const filteredData = gateFields.reduce((acc, key) => {
        if (presetData[key] !== undefined) {
          acc[key] = presetData[key]
        }
        return acc
      }, {} as Record<string, string>)

      setManualValues(prev => ({ ...prev, ...filteredData }))

      // Clear hepatitis preset data in fresh mode
      setHepatitisPresetData(undefined)
    }
  }

  const handleManualValueChange = (key: string, value: string) => {
    // Special handling for gender (not numeric)
    if (key === 'Gender') {
      setManualValues(prev => ({ ...prev, [key]: value }))
      return
    }

    // Allow empty values and decimal points for better UX
    if (value === '' || value === '.' || value === '0.') {
      setManualValues(prev => ({ ...prev, [key]: value }))
      return
    }

    // Validate numeric input with decimal support
    const numericRegex = /^-?\d*\.?\d*$/
    if (!numericRegex.test(value)) {
      return // Don't update if not a valid number format
    }

    // Prevent multiple decimal points
    const decimalCount = (value.match(/\./g) || []).length
    if (decimalCount > 1) {
      return
    }

    // Limit decimal places to 2
    const parts = value.split('.')
    if (parts[1] && parts[1].length > 2) {
      return
    }

    setManualValues(prev => ({ ...prev, [key]: value }))
  }

  const handleFieldNameChange = (key: string, newName: string) => {
    setFieldNames(prev => ({ ...prev, [key]: newName }))
  }

  const startEditingField = (key: string) => {
    setEditingField(key)
  }

  const stopEditingField = () => {
    setEditingField(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent, action?: () => void) => {
    if (event.key === 'Enter' && action) {
      event.preventDefault()
      action()
    }
  }

  const addLabValue = () => {
    const newKey = `Lab${Object.keys(manualValues).length + 1}`
    setManualValues(prev => ({ ...prev, [newKey]: '' }))
  }

  const removeLabValue = (key: string) => {
    setManualValues(prev => {
      const newValues = { ...prev }
      delete newValues[key]
      return newValues
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 p-2 md:p-4 lg:p-6 shadow-xl border border-white/20 backdrop-blur-xl animate-in fade-in-0 duration-500 hover:shadow-2xl transition-all duration-500 min-h-[500px] md:min-h-[600px]">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-pulse"></div>
      <div className="absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl animate-float"></div>
      <div className="absolute -bottom-10 -left-10 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 h-full">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg animate-glow mb-4">
            <FileImage className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            AI Medical Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">Enter values for AI analysis</p>
        </div>
        <Tabs defaultValue="manual" className="w-full">
          <TabsContent value="manual" className="space-y-4 md:space-y-6" id="manual-panel" role="tabpanel" aria-labelledby="manual-tab">
            <div className="space-y-4">
              {/* Hide this card if gate analysis detected a sick patient */}
              {!(gateResult && gateResult.diagnosis !== 'Healthy') && (
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Liver Disease Detection</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Using AI models to screen for liver disease risk and provide detailed analysis
                    </p>
                  </CardHeader>
                </Card>
              )}

              {/* Scrollable Form Container */}
              <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
                {/* Gate Screening Form - Always visible */}
                <Card className="gradient-card">
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base md:text-lg">General Liver Function Test</CardTitle>
                      {gateResult && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setGateExpanded(!gateExpanded)}
                            className="text-xs"
                          >
                            {gateExpanded ? "Hide Parameters" : "Show Parameters"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditValues({...manualValues})
                              setIsEditingParameters(true)
                            }}
                            className="text-xs"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit Parameters
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {gateExpanded && (
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        {/* Row 1: Age and Gender */}
                        <div className="flex flex-col">
                          <Label className="text-xs font-medium min-h-[2rem] flex items-end">
                            <span className="whitespace-nowrap truncate">{fieldNames['age'] || 'age'}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              ({fieldMetadata['age'].unit}) - Normal: {fieldMetadata['age'].range}
                            </span>
                          </Label>
                          <Input
                            type="number"
                            value={manualValues['age'] || ''}
                            onChange={(e) => setManualValues(prev => ({ ...prev, age: e.target.value }))}
                            placeholder="Enter age"
                            className="h-12 w-full text-sm"
                            disabled={gateResult && gateResult.diagnosis !== 'Healthy'}
                          />
                        </div>
                        <div className="flex flex-col">
                          <Label className="text-xs font-medium min-h-[2rem] flex items-end">
                            <span className="whitespace-nowrap truncate">{fieldNames['gender'] || 'gender'}</span>
                          </Label>
                          <Select
                            value={manualValues['gender'] || ''}
                            onValueChange={(val) => setManualValues(prev => ({ ...prev, gender: val }))}
                            disabled={gateResult && gateResult.diagnosis !== 'Healthy'}
                          >
                            <SelectTrigger className="h-12 w-full text-sm">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Divider */}
                        <div className="col-span-full border-t border-border/50 my-1"></div>

                        {/* Rows 2-5: Lab Parameters */}
                        {[
                          'bilirubin', 'bilirubin_direct',
                          'alp', 'alt',
                          'ast', 'total_proteins',
                          'albumin', 'ag_ratio'
                        ].map((key) => {
                          const metadata = fieldMetadata[key]
                          const displayName = fieldNames[key] || key
                          const value = manualValues[key] || ''

                          return (
                            <div key={key} className="flex flex-col">
                              <Label className="text-xs font-medium min-h-[2rem] flex items-end">
                                <span className="whitespace-nowrap truncate">{displayName}</span>
                                {metadata && (
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    ({metadata.unit}) - Normal: {metadata.range}
                                  </span>
                                )}
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={value}
                                onChange={(e) => setManualValues(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={`Enter ${displayName.toLowerCase()}`}
                                className="h-12 w-full text-sm"
                                disabled={gateResult && gateResult.diagnosis !== 'Healthy'}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Diagnosis Result Section - Only show for sick patients */}
              {gateResult && gateResult.diagnosis !== 'Healthy' && (
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      General Test Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Diagnosis:</span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {gateResult.diagnosis}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Confidence:</span>
                        <span className="text-sm">{gateResult.confidence}%</span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{gateResult.advice.replace('Gate screening', 'General Test')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sub-Models Tabs - Only show for sick patients */}
              {gateResult && gateResult.diagnosis !== 'Healthy' && (
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Detailed Analysis</CardTitle>
                    <p className="text-xs text-muted-foreground">Multi-stage liver disease prediction using specialized AI models</p>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        {tabConfig.map((tab) => (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            style={{
                              color: activeTab === tab.value ? tab.activeTextColor : undefined,
                              backgroundColor: activeTab === tab.value ? tab.activeBackgroundColor : undefined,
                            }}
                          >
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <TabsContent value="cancer" className="space-y-4">
                        <div
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: activeTab === "cancer" ? "#fef2f2" : "#fef2f2",
                          }}
                        >
                          <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Cancer Risk Assessment</h4>
                          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                            This model evaluates cancer risk based on demographic factors, lifestyle, and genetic predisposition.
                          </p>

                          {/* Cancer Risk Form */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Age */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Age <span className="text-xs text-muted-foreground">(General Test(not changable))</span></Label>
                              <Input
                                type="number"
                                value={manualValues['age'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, age: e.target.value }))}
                                placeholder="Enter age"
                                className="text-sm"
                                disabled
                              />
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Gender <span className="text-xs text-muted-foreground">(General Test(not changable))</span></Label>
                              <Select
                                value={manualValues['gender'] || ''}
                                onValueChange={(val) => setManualValues(prev => ({ ...prev, gender: val }))}
                                disabled
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* BMI */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">BMI</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={manualValues['bmi'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, bmi: e.target.value }))}
                                placeholder="Enter BMI"
                                className="text-sm"
                              />
                            </div>

                            {/* Smoking */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Smoking</Label>
                              <Select
                                value={manualValues['smoking'] || ''}
                                onValueChange={(val) => setManualValues(prev => ({ ...prev, smoking: val }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select smoking status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Genetic Risk */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Genetic Risk</Label>
                              <Select
                                value={manualValues['genetic_risk'] || ''}
                                onValueChange={(val) => setManualValues(prev => ({ ...prev, genetic_risk: val }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select genetic risk" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Physical Activity */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Physical Activity</Label>
                              <Select
                                value={manualValues['activity'] || ''}
                                onValueChange={(val) => setManualValues(prev => ({ ...prev, activity: val }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select activity level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Moderate">Moderate</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Alcohol Intake */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Alcohol Intake</Label>
                              <Select
                                value={manualValues['alcohol'] || ''}
                                onValueChange={(val) => setManualValues(prev => ({ ...prev, alcohol: val }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select alcohol consumption" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Moderate">Moderate</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Cancer History */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Cancer History</Label>
                              <Select
                                value={manualValues['cancer_history'] || ''}
                                onValueChange={(val) => setManualValues(prev => ({ ...prev, cancer_history: val }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Family cancer history" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="mt-6 flex justify-start gap-3">
                            <Button
                              onClick={handleCancerAnalysis}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                "Analyze Cancer Risk"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                // Reset cancer-related fields (excluding age and gender)
                                const cancerFields = ['bmi', 'smoking', 'alcohol', 'activity', 'genetic_risk', 'cancer_history']
                                const resetData: Record<string, string> = {}
                                cancerFields.forEach(field => {
                                  resetData[field] = ''
                                })
                                setManualValues(prev => ({ ...prev, ...resetData }))
                              }}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Reset Form
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="hepatitis" className="space-y-4">
                        <div style={{ backgroundColor: activeTab === "hepatitis" ? "#eff6ff" : "#eff6ff" }}>
                          <HepatitisInput
                            gateData={{
                              age: Number(manualValues['age']) || 0,
                              gender: manualValues['gender'] || '',
                              total_bilirubin: Number(manualValues['bilirubin']) || 0,
                              alkaline_phosphotase: Number(manualValues['alp']) || 0,
                              aspartate_aminotransferase: Number(manualValues['ast']) || 0,
                              albumin: Number(manualValues['albumin']) || 0,
                            }}
                            presetData={hepatitisPresetData}
                            onAnalysisComplete={(responseData) => {
                              // Handle hepatitis analysis result
                              console.log('Hepatitis analysis result:', responseData)

                              // Check if the response has the expected structure
                              if (responseData.results && responseData.results.hepatitis) {
                                // Deep merge the hepatitis result into analysis state
                                setGateResult((prev: any) => ({
                                  ...prev,
                                  results: {
                                    ...prev?.results,
                                    hepatitis: responseData.results.hepatitis
                                  }
                                }))

                                // Update global result for display in right column
                                setResult(prev => ({
                                  ...prev,
                                  results: {
                                    ...(prev?.results || {}), // PRESERVE existing siblings
                                    hepatitis: responseData.results.hepatitis
                                  }
                                }))

                                // Update analysis order - move hepatitis to front
                                setAnalysisOrder(prev => ['hepatitis', ...prev.filter(item => item !== 'hepatitis')])

                                // Trigger the UI refresh
                                toast.success("Hepatitis Analysis Complete", {
                                  description: `Stage ${responseData.results.hepatitis.stage} Fibrosis Detected`,
                                })
                              } else {
                                console.error("Invalid Hepatitis Response:", responseData)
                                toast.error("Analysis Error", {
                                  description: "Received incomplete data from server"
                                })
                              }
                            }}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="fatty" className="space-y-4">
                        <div
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: activeTab === "fatty" ? "#f0fdf4" : "#f0fdf4",
                          }}
                        >
                          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Fatty Liver Disease Detection</h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                            This model detects Non-Alcoholic Fatty Liver Disease (NAFLD) based on metabolic markers and liver enzymes.
                          </p>

                          {/* Fatty Liver Form */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Albumin */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Albumin (g/dL) <span className="text-xs text-muted-foreground">(General Test(not changable))</span></Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={manualValues['albumin'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, albumin: e.target.value }))}
                                placeholder="3.5-5.0"
                                className="text-sm"
                                disabled
                              />
                            </div>

                            {/* ALP */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">ALP (IU/L) <span className="text-xs text-muted-foreground">(General Test(not changable))</span></Label>
                              <Input
                                type="number"
                                value={manualValues['alp'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, alp: e.target.value }))}
                                placeholder="44-147"
                                className="text-sm"
                                disabled
                              />
                            </div>

                            {/* AST */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">AST (IU/L) <span className="text-xs text-muted-foreground">(General Test(not changable))</span></Label>
                              <Input
                                type="number"
                                value={manualValues['ast'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, ast: e.target.value }))}
                                placeholder="10-40"
                                className="text-sm"
                                disabled
                              />
                            </div>

                            {/* ALT */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">ALT (IU/L) <span className="text-xs text-muted-foreground">(General Test(not changable))</span></Label>
                              <Input
                                type="number"
                                value={manualValues['alt'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, alt: e.target.value }))}
                                placeholder="7-56"
                                className="text-sm"
                                disabled
                              />
                            </div>

                            {/* Cholesterol */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Cholesterol (mg/dL)</Label>
                              <Input
                                type="number"
                                value={manualValues['cholesterol'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, cholesterol: e.target.value }))}
                                placeholder="<200"
                                className="text-sm"
                              />
                            </div>

                            {/* Creatinine */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Creatinine (mg/dL)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={manualValues['creatinine'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, creatinine: e.target.value }))}
                                placeholder="0.7-1.3"
                                className="text-sm"
                              />
                            </div>

                            {/* Glucose */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Glucose (mg/dL)</Label>
                              <Input
                                type="number"
                                value={manualValues['glucose'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, glucose: e.target.value }))}
                                placeholder="70-100"
                                className="text-sm"
                              />
                            </div>

                            {/* GGT */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">GGT (IU/L)</Label>
                              <Input
                                type="number"
                                value={manualValues['ggt'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, ggt: e.target.value }))}
                                placeholder="9-48"
                                className="text-sm"
                              />
                            </div>

                            {/* Bilirubin */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Total Bilirubin (mg/dL) <span className="text-xs text-muted-foreground">(General Test(not changable))</span></Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={manualValues['bilirubin'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, bilirubin: e.target.value }))}
                                placeholder="0.3-1.2"
                                className="text-sm"
                                disabled
                              />
                            </div>

                            {/* Triglycerides */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Triglycerides (mg/dL)</Label>
                              <Input
                                type="number"
                                value={manualValues['triglycerides'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, triglycerides: e.target.value }))}
                                placeholder="<150"
                                className="text-sm"
                              />
                            </div>

                            {/* Uric Acid */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Uric Acid (mg/dL)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={manualValues['uric_acid'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, uric_acid: e.target.value }))}
                                placeholder="3.5-7.2"
                                className="text-sm"
                              />
                            </div>

                            {/* Platelets */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Platelets (×10³/µL)</Label>
                              <Input
                                type="number"
                                value={manualValues['platelets'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, platelets: e.target.value }))}
                                placeholder="150-450"
                                className="text-sm"
                              />
                            </div>

                            {/* HDL */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">HDL (mg/dL)</Label>
                              <Input
                                type="number"
                                value={manualValues['hdl'] || ''}
                                onChange={(e) => setManualValues(prev => ({ ...prev, hdl: e.target.value }))}
                                placeholder="≥40"
                                className="text-sm"
                              />
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="mt-6 flex justify-start gap-3">
                            <Button
                              onClick={handleFattyLiverAnalysis}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                "Analyze Fatty Liver"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                // Reset fatty liver-related fields (excluding gate parameters)
                                const gateFields = ['age', 'gender', 'bilirubin', 'bilirubin_direct', 'alp', 'alt', 'ast', 'total_proteins', 'albumin', 'ag_ratio']
                                const allFattyLiverFields = ['albumin', 'alp', 'ast', 'alt', 'cholesterol', 'creatinine', 'glucose', 'ggt', 'bilirubin', 'triglycerides', 'uric_acid', 'platelets', 'hdl']
                                const fattyLiverFields = allFattyLiverFields.filter(field => !gateFields.includes(field))
                                const resetData: Record<string, string> = {}
                                fattyLiverFields.forEach(field => {
                                  resetData[field] = ''
                                })
                                setManualValues(prev => ({ ...prev, ...resetData }))
                              }}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              Reset Form
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle className="text-base">Sample Data Presets</CardTitle>
                  <p className="text-xs text-muted-foreground">Load predefined test cases for demonstration</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect({
                        age: '25', gender: 'Male', bmi: '24', smoking: 'No', alcohol: 'Low', activity: 'Moderate', genetic_risk: 'Low', cancer_history: 'No',
                        ascites: 'No', hepatomegaly: 'No', spiders: 'No', edema: 'No',
                        bilirubin: '0.7', bilirubin_direct: '0.1', cholesterol: '180', albumin: '4.0', copper: '110', alp: '150', alt: '20', ast: '22', total_proteins: '7.5', ag_ratio: '1.10', platelets: '280000', prothrombin: '12.5', inr: '1.0', creatinine: '0.9', glucose: '95', ggt: '40', triglycerides: '140', uric_acid: '4.5', hdl: '55'
                      })}
                      className="text-xs"
                    >
                      Normal Values
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect({
                        age: '55', gender: 'Male', bmi: '32', smoking: 'Yes', alcohol: 'High', activity: 'Low', genetic_risk: 'High', cancer_history: 'Yes',
                        ascites: 'Yes', hepatomegaly: 'Yes', spiders: 'Yes', edema: 'Severe',
                        bilirubin: '2.8', bilirubin_direct: '1.4', cholesterol: '280', albumin: '3.2', copper: '180', alp: '140', alt: '120', ast: '85', total_proteins: '6.8', ag_ratio: '0.8', platelets: '180000', prothrombin: '15.5', inr: '1.8', creatinine: '1.4', glucose: '140', ggt: '180', triglycerides: '220', uric_acid: '7.2', hdl: '35'
                      })}
                      className="text-xs"
                    >
                      High Risk Case
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect({
                        age: '35', gender: 'Female', bmi: '28', smoking: 'No', alcohol: 'Moderate', activity: 'Moderate', genetic_risk: 'Medium', cancer_history: 'No',
                        ascites: 'No', hepatomegaly: 'Yes', spiders: 'No', edema: 'Slight',
                        bilirubin: '1.8', bilirubin_direct: '0.2', cholesterol: '210', albumin: '3.8', copper: '130', alp: '105', alt: '85', ast: '65', total_proteins: '7.0', ag_ratio: '1.0', platelets: '220000', prothrombin: '13.8', inr: '1.2', creatinine: '0.8', glucose: '105', ggt: '95', triglycerides: '165', uric_acid: '5.2', hdl: '48'
                      })}
                      className="text-xs"
                    >
                      Moderate Risk
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {!(gateResult && gateResult.diagnosis !== 'Healthy') && (
                <Card className="gradient-card">
                  <CardContent className="pt-4">
                    <Button
                      onClick={handleManualSubmit}
                      disabled={isUploading || ['age', 'gender', 'bilirubin', 'bilirubin_direct', 'alp', 'alt', 'ast', 'total_proteins', 'albumin', 'ag_ratio'].some(key => !manualValues[key] || manualValues[key].trim() === '')}
                      className="w-full rounded-xl gradient-primary hover-lift disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label={isUploading ? "Analyzing" : "Run general test"}
                      onKeyDown={(e) => handleKeyDown(e, handleManualSubmit)}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          <span className="animate-pulse">Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Run General Test
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      General Test using 10 key parameters to detect potential liver disease risk
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Parameters Dialog */}
        <Dialog open={isEditingParameters} onOpenChange={setIsEditingParameters}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Gate Screening Parameters</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Edit Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {/* Row 1: Age and Gender */}
                <div className="flex flex-col">
                  <Label className="text-xs font-medium min-h-[2rem] flex items-end">
                    <span className="whitespace-nowrap truncate">{fieldNames['age'] || 'age'}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      ({fieldMetadata['age'].unit}) - Normal: {fieldMetadata['age'].range}
                    </span>
                  </Label>
                  <Input
                    type="number"
                    value={editValues['age'] || ''}
                    onChange={(e) => setEditValues(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Enter age"
                    className="h-12 w-full text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-xs font-medium min-h-[2rem] flex items-end">
                    <span className="whitespace-nowrap truncate">{fieldNames['gender'] || 'gender'}</span>
                  </Label>
                  <Select
                    value={editValues['gender'] || ''}
                    onValueChange={(val) => setEditValues(prev => ({ ...prev, gender: val }))}
                  >
                    <SelectTrigger className="h-12 w-full text-sm">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Divider */}
                <div className="col-span-full border-t border-border/50 my-1"></div>

                {/* Rows 2-5: Lab Parameters */}
                {[
                  'bilirubin', 'bilirubin_direct',
                  'alp', 'alt',
                  'ast', 'total_proteins',
                  'albumin', 'ag_ratio'
                ].map((key) => {
                  const metadata = fieldMetadata[key]
                  const displayName = fieldNames[key] || key
                  const value = editValues[key] || ''

                  return (
                    <div key={key} className="flex flex-col">
                      <Label className="text-xs font-medium min-h-[2rem] flex items-end">
                        <span className="whitespace-nowrap truncate">{displayName}</span>
                        {metadata && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            ({metadata.unit}) - Normal: {metadata.range}
                          </span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`Enter ${displayName.toLowerCase()}`}
                        className="h-12 w-full text-sm"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingParameters(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Validate required fields
                  const gateFields = ['age', 'gender', 'bilirubin', 'bilirubin_direct', 'alp', 'alt', 'ast', 'total_proteins', 'albumin', 'ag_ratio']
                  const missingRequired = gateFields.filter(key => !editValues[key] || editValues[key].trim() === '')

                  if (missingRequired.length > 0) {
                    toast.error("Required Fields Missing", {
                      description: `Please fill in: ${missingRequired.join(', ')}`,
                    })
                    return
                  }

                  // Update main values and close dialog
                  setManualValues(editValues)
                  setIsEditingParameters(false)

                  // Re-run analysis with new values
                  setIsUploading(true)
                  try {
                    const payload: Record<string, any> = { mode: 'gate' }
                    const keyMapping: Record<string, string> = {
                      'age': 'age',
                      'gender': 'gender',
                      'bilirubin': 'total_bilirubin',
                      'bilirubin_direct': 'direct_bilirubin',
                      'alp': 'alkaline_phosphotase',
                      'alt': 'alamine_aminotransferase',
                      'ast': 'aspartate_aminotransferase',
                      'total_proteins': 'total_protiens',
                      'albumin': 'albumin',
                      'ag_ratio': 'albumin_and_globulin_ratio'
                    }

                    gateFields.forEach(key => {
                      const backendKey = keyMapping[key] || key
                      if (['age', 'bilirubin', 'bilirubin_direct', 'alp', 'alt', 'ast', 'total_proteins', 'albumin', 'ag_ratio'].includes(key)) {
                        payload[backendKey] = Number(editValues[key])
                      } else {
                        payload[backendKey] = editValues[key]
                      }
                    })

                    const response = await fetch("/api/analyze", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    })

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
                      throw new Error(errorData.error || `Backend error: ${response.status}`)
                    }

                    const result = await response.json()

                    if (result.success) {
                      setGateResult(result)
                      setGateExpanded(false)

                      // If new result is healthy, hide detailed analysis
                      if (result.diagnosis === 'Healthy') {
                        // Detailed analysis will be hidden automatically due to conditional rendering
                      }

                      // Clear any existing detailed analysis results before setting new gate result
                      setResult({
                        diagnosis: result.diagnosis,
                        confidence: result.confidence,
                        advice: result.advice,
                        gate_prediction: result.diagnosis === 'Healthy' ? 1 : 0,
                        results: {} // Clear all previous detailed analysis results
                      })

                      if (result.diagnosis === 'Healthy') {
                        toast.success("General Test Complete", {
                          description: "Patient appears healthy. No further analysis needed.",
                        })
                      } else {
                        toast.warning("General Test Complete", {
                          description: "Potential risk detected. Detailed analysis available in tabs below.",
                        })
                      }
                    } else {
                      throw new Error(result.error || "Analysis failed")
                    }
                  } catch (error) {
                    console.error("Re-analysis error:", error)
                    const errorMessage = error instanceof Error ? error.message : "Failed to re-analyze patient profile. Please try again."
                    toast.error("Re-analysis Failed", {
                      description: errorMessage,
                    })
                  } finally {
                    setIsUploading(false)
                  }
                }}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  "Re-analyze"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
