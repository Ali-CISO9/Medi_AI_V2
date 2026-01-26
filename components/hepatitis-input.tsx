"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { toast } from 'sonner'

interface HepatitisFormData {
  // Clinical Labs (Number inputs)
  platelets: string
  prothrombin: string
  inr: string
  cholesterol: string
  triglycerides: string
  copper: string

  // Physical Signs (Boolean toggles)
  hepatomegaly: boolean
  spiders: boolean
  edema: boolean
  ascites: boolean
}

interface GateData {
  age: number
  gender: string
  total_bilirubin: number
  alkaline_phosphotase: number
  aspartate_aminotransferase: number
  albumin: number
}

interface HepatitisInputProps {
  gateData: GateData
  onAnalysisComplete: (result: any) => void
  presetData?: Record<string, string>
  setHepatitisInput?: (input: any) => void
}

export function HepatitisInput({ gateData, onAnalysisComplete, presetData, setHepatitisInput }: HepatitisInputProps) {
  const [hepatitisForm, setHepatitisForm] = useState<HepatitisFormData>({
    // Clinical Labs - defaults
    platelets: '',
    prothrombin: '',
    inr: '',
    cholesterol: '',
    triglycerides: '',
    copper: '',

    // Physical Signs - defaults to false
    hepatomegaly: false,
    spiders: false,
    edema: false,
    ascites: false,
  })

  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Update form when preset data changes
  React.useEffect(() => {
    if (presetData) {
      setHepatitisForm(prev => ({
        ...prev,
        // Map preset data to hepatitis form fields
        platelets: presetData.platelets || '',
        prothrombin: presetData.prothrombin || '',
        inr: presetData.inr || '',
        cholesterol: presetData.cholesterol || '',
        triglycerides: presetData.triglycerides || '',
        copper: presetData.copper || '',
        hepatomegaly: presetData.hepatomegaly === 'Yes' || false,
        spiders: presetData.spiders === 'Yes' || false,
        edema: presetData.edema === 'Yes' || false,
        ascites: presetData.ascites === 'Yes' || false,
      }))
    }
  }, [presetData])

  // Clinical lab metadata for units and ranges
  const clinicalLabMetadata = {
    platelets: { unit: '×10³/µL', range: '150-450', label: 'Platelets' },
    prothrombin: { unit: '', range: '11s-13s', label: 'Prothrombin Time' },
    inr: { unit: '', range: '0.8-1.1', label: 'INR' },
    cholesterol: { unit: 'mg/dL', range: '<200', label: 'Cholesterol' },
    triglycerides: { unit: 'mg/dL', range: '<150', label: 'Triglycerides' },
    copper: { unit: 'µg/dL', range: '70-140', label: 'Copper' },
  }

  const handleNumberInputChange = (field: keyof HepatitisFormData, value: string) => {
    // Allow empty values and decimal points for better UX
    if (value === '' || value === '.' || value === '0.') {
      setHepatitisForm(prev => ({ ...prev, [field]: value }))
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

    setHepatitisForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSwitchChange = (field: keyof HepatitisFormData, checked: boolean) => {
    setHepatitisForm(prev => ({ ...prev, [field]: checked }))
  }

  const validateForm = (): boolean => {
    const requiredFields = ['platelets', 'prothrombin', 'inr', 'cholesterol', 'triglycerides', 'copper']

    for (const field of requiredFields) {
      if (!hepatitisForm[field as keyof HepatitisFormData] || hepatitisForm[field as keyof HepatitisFormData] === '') {
        toast.error("Required Fields Missing", {
          description: `Please fill in ${clinicalLabMetadata[field as keyof typeof clinicalLabMetadata].label}`,
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsAnalyzing(true)

    // Set hepatitis input for persistence
    if (setHepatitisInput) {
      setHepatitisInput({
        Platelets: hepatitisForm.platelets,
        Prothrombin: hepatitisForm.prothrombin,
        INR: hepatitisForm.inr,
        Cholesterol: hepatitisForm.cholesterol,
        Triglycerides: hepatitisForm.triglycerides,
        Copper: hepatitisForm.copper,
        Hepatomegaly: hepatitisForm.hepatomegaly ? 'Yes' : 'No',
        Spiders: hepatitisForm.spiders ? 'Yes' : 'No',
        Edema: hepatitisForm.edema ? 'Yes' : 'No',
        Ascites: hepatitisForm.ascites ? 'Yes' : 'No'
      })
    }

    try {
      // Map gate data to backend's expected short key names
      const mappedGateData = {
        bilirubin: gateData.total_bilirubin,
        alp: gateData.alkaline_phosphotase,
        ast: gateData.aspartate_aminotransferase,
        albumin: gateData.albumin,
        age: gateData.age,
        gender: gateData.gender,
      }

      // Merge mapped gate data with hepatitis form data
      const payload = {
        mode: 'hepatitis',
        user_profile: {
          ...mappedGateData,
          ...hepatitisForm,
          // Convert string numbers to numbers for backend
          platelets: Number(hepatitisForm.platelets),
          prothrombin: Number(hepatitisForm.prothrombin),
          inr: Number(hepatitisForm.inr),
          cholesterol: Number(hepatitisForm.cholesterol),
          triglycerides: Number(hepatitisForm.triglycerides),
          copper: Number(hepatitisForm.copper),
        }
      }

      console.log('Sending hepatitis payload:', payload)

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
        onAnalysisComplete(result)
        toast.success("Hepatitis Analysis Complete", {
          description: "Fibrosis assessment completed successfully.",
        })
      } else {
        throw new Error(result.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Hepatitis analysis error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze hepatitis profile. Please try again."
      toast.error("Analysis Failed", {
        description: errorMessage,
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="p-4 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Hepatitis Fibrosis Assessment</h4>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        This 3-stage model analyzes hepatitis progression through fibrosis staging, complications, and mortality risk.
      </p>

      <div className="space-y-6">
        {/* Section A: Clinical Labs */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Clinical Labs</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(clinicalLabMetadata).map(([key, metadata]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {metadata.label}
                  <span className="text-xs text-muted-foreground ml-1">
                    {metadata.unit && `(${metadata.unit}) - `}Normal: {metadata.range}
                  </span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={hepatitisForm[key as keyof HepatitisFormData] as string}
                  onChange={(e) => handleNumberInputChange(key as keyof HepatitisFormData, e.target.value)}
                  placeholder={`Enter ${metadata.label.toLowerCase()}`}
                  className="text-sm h-10"
                  disabled={isAnalyzing}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Section B: Physical Signs */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Physical Symptoms</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-full min-h-[4rem] flex items-center justify-between p-3 rounded-xl border">
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium text-slate-700">Hepatomegaly</span>
                <span className="text-xs text-slate-500">(Enlarged Liver)</span>
              </div>
              <Switch
                checked={hepatitisForm.hepatomegaly}
                onCheckedChange={(checked) => handleSwitchChange('hepatomegaly', checked)}
                disabled={isAnalyzing}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
            </div>

            <div className="h-full min-h-[4rem] flex items-center justify-between p-3 rounded-xl border">
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium text-slate-700">Spider Angiomas</span>
                <span className="text-xs text-slate-500">(Skin Lesions)</span>
              </div>
              <Switch
                checked={hepatitisForm.spiders}
                onCheckedChange={(checked) => handleSwitchChange('spiders', checked)}
                disabled={isAnalyzing}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
            </div>

            <div className="h-full min-h-[4rem] flex items-center justify-between p-3 rounded-xl border">
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium text-slate-700">Edema</span>
                <span className="text-xs text-slate-500">(Fluid Retention)</span>
              </div>
              <Switch
                checked={hepatitisForm.edema}
                onCheckedChange={(checked) => handleSwitchChange('edema', checked)}
                disabled={isAnalyzing}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
            </div>

            <div className="h-full min-h-[4rem] flex items-center justify-between p-3 rounded-xl border">
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium text-slate-700">Ascites</span>
                <span className="text-xs text-slate-500">(Abdominal Fluid)</span>
              </div>
              <Switch
                checked={hepatitisForm.ascites}
                onCheckedChange={(checked) => handleSwitchChange('ascites', checked)}
                disabled={isAnalyzing}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-start gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Hepatitis...
              </>
            ) : (
              "Analyze Hepatitis"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Reset hepatitis form
              setHepatitisForm({
                platelets: '',
                prothrombin: '',
                inr: '',
                cholesterol: '',
                triglycerides: '',
                copper: '',
                hepatomegaly: false,
                spiders: false,
                edema: false,
                ascites: false,
              })
              if (setHepatitisInput) {
                setHepatitisInput(null) // Clear persisted hepatitis input
              }
            }}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Reset Form
          </Button>
        </div>
      </div>
    </div>
  )
}