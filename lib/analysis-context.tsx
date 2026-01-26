"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'

interface AnalysisResult {
  diagnosis?: string
  confidence?: number
  advice?: string
  gate_prediction?: number
  results?: {
    cancer?: any
    hepatitis?: any
    fatty_liver?: any
  }
}

interface AnalysisInput {
  ALT: string
  AST: string
  Bilirubin: string
  DirectBilirubin: string
  GGT: string
  Age: string
  Gender: string
  AlkPhos: string
  TP: string
  ALB: string
  AG: string
}

interface CancerInput {
  BMI: string
  Smoking: string
  Alcohol: string
  Activity: string
  GeneticRisk: string
  CancerHistory: string
}

interface FattyLiverInput {
  Cholesterol: string
  Creatinine: string
  Glucose: string
  GGT: string
  Triglycerides: string
  UricAcid: string
  Platelets: string
  HDL: string
}

interface HepatitisInput {
  Platelets: string
  Prothrombin: string
  INR: string
  Cholesterol: string
  Triglycerides: string
  Copper: string
  Hepatomegaly: string
  Spiders: string
  Edema: string
  Ascites: string
}

interface Patient {
  id: number
  name: string
  patient_id: string
  birth_date?: string
  email?: string
  phone?: string
  profile_picture?: string
  department?: string
  doctor_name?: string
}

interface PatientAnalysis {
  id: number
  patient_id: number
  diagnosis: string
  confidence: number
  advice: string
  created_at: string
  updated_at?: string
  patient_name?: string
  patient_id_display?: string
  birth_date?: string
  email?: string
  phone?: string
  profile_picture?: string
  doctor_name?: string
  department?: string
}

interface PatientContextType {
  patients: Patient[]
  patientAnalyses: PatientAnalysis[]
  isLoadingPatients: boolean
  isLoadingAnalyses: boolean
  refreshPatients: () => Promise<void>
  refreshAnalyses: () => Promise<void>
  refreshAllData: () => Promise<void>
}

interface AnalysisContextType {
  result: AnalysisResult | null
  input: AnalysisInput | null
  cancerInput: CancerInput | null
  fattyLiverInput: FattyLiverInput | null
  hepatitisInput: HepatitisInput | null
  analysisOrder: string[]
  setResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>
  setInput: React.Dispatch<React.SetStateAction<AnalysisInput | null>>
  setCancerInput: React.Dispatch<React.SetStateAction<CancerInput | null>>
  setFattyLiverInput: React.Dispatch<React.SetStateAction<FattyLiverInput | null>>
  setHepatitisInput: React.Dispatch<React.SetStateAction<HepatitisInput | null>>
  setAnalysisOrder: React.Dispatch<React.SetStateAction<string[]>>
  reset: () => void
  resetAll: () => void
}

const PatientContext = createContext<PatientContextType | undefined>(undefined)
const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientAnalyses, setPatientAnalyses] = useState<PatientAnalysis[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false)

  const refreshPatients = useCallback(async () => {
    setIsLoadingPatients(true)
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      } else {
        console.error('Failed to fetch patients')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setIsLoadingPatients(false)
    }
  }, [])

  const refreshAnalyses = useCallback(async () => {
    setIsLoadingAnalyses(true)
    try {
      const response = await fetch('/api/patient-analyses')
      if (response.ok) {
        const data = await response.json()
        setPatientAnalyses(data.analyses || [])
      } else {
        console.error('Failed to fetch patient analyses')
      }
    } catch (error) {
      console.error('Error fetching patient analyses:', error)
    } finally {
      setIsLoadingAnalyses(false)
    }
  }, [])

  const refreshAllData = useCallback(async () => {
    await Promise.all([refreshPatients(), refreshAnalyses()])
  }, [refreshPatients, refreshAnalyses])

  return (
    <PatientContext.Provider value={{
      patients,
      patientAnalyses,
      isLoadingPatients,
      isLoadingAnalyses,
      refreshPatients,
      refreshAnalyses,
      refreshAllData
    }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatients() {
  const context = useContext(PatientContext)
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider')
  }
  return context
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [input, setInput] = useState<AnalysisInput | null>(null)
  const [cancerInput, setCancerInput] = useState<CancerInput | null>(null)
  const [fattyLiverInput, setFattyLiverInput] = useState<FattyLiverInput | null>(null)
  const [hepatitisInput, setHepatitisInput] = useState<HepatitisInput | null>(null)
  const [analysisOrder, setAnalysisOrder] = useState<string[]>([])

  // Load result from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("current_analysis_result")
    if (saved) {
      try {
        setResult(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved analysis result", e)
      }
    }
  }, [])

  // Save result to sessionStorage whenever it changes
  useEffect(() => {
    if (result) {
      sessionStorage.setItem("current_analysis_result", JSON.stringify(result))
    } else {
      sessionStorage.removeItem("current_analysis_result")
    }
  }, [result])

  // Load input from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("inputs_general")
    if (saved) {
      try {
        setInput(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved analysis input", e)
      }
    }
  }, [])

  // Save input to sessionStorage whenever it changes
  useEffect(() => {
    if (input) {
      sessionStorage.setItem("inputs_general", JSON.stringify(input))
    } else {
      sessionStorage.removeItem("inputs_general")
    }
  }, [input])

  // Load cancerInput from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("inputs_cancer")
    if (saved) {
      try {
        setCancerInput(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved cancer input", e)
      }
    }
  }, [])

  // Save cancerInput to sessionStorage whenever it changes
  useEffect(() => {
    if (cancerInput) {
      sessionStorage.setItem("inputs_cancer", JSON.stringify(cancerInput))
    } else {
      sessionStorage.removeItem("inputs_cancer")
    }
  }, [cancerInput])

  // Load fattyLiverInput from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("inputs_fatty")
    if (saved) {
      try {
        setFattyLiverInput(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved fatty liver input", e)
      }
    }
  }, [])

  // Save fattyLiverInput to sessionStorage whenever it changes
  useEffect(() => {
    if (fattyLiverInput) {
      sessionStorage.setItem("inputs_fatty", JSON.stringify(fattyLiverInput))
    } else {
      sessionStorage.removeItem("inputs_fatty")
    }
  }, [fattyLiverInput])

  // Load hepatitisInput from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("inputs_hepatitis")
    if (saved) {
      try {
        setHepatitisInput(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved hepatitis input", e)
      }
    }
  }, [])

  // Save hepatitisInput to sessionStorage whenever it changes
  useEffect(() => {
    if (hepatitisInput) {
      sessionStorage.setItem("inputs_hepatitis", JSON.stringify(hepatitisInput))
    } else {
      sessionStorage.removeItem("inputs_hepatitis")
    }
  }, [hepatitisInput])

  const reset = () => {
    setResult(null)
    setInput(null)
    setCancerInput(null)
    setFattyLiverInput(null)
    setHepatitisInput(null)
    setAnalysisOrder([])
    sessionStorage.removeItem("current_analysis_result")
    sessionStorage.removeItem("inputs_general")
    sessionStorage.removeItem("inputs_cancer")
    sessionStorage.removeItem("inputs_fatty")
    sessionStorage.removeItem("inputs_hepatitis")
  }

  const resetAll = () => {
    setResult(null)
    setInput(null)
    setCancerInput(null)
    setFattyLiverInput(null)
    setHepatitisInput(null)
    setAnalysisOrder([])
    sessionStorage.removeItem("current_analysis_result")
    sessionStorage.removeItem("inputs_general")
    sessionStorage.removeItem("inputs_cancer")
    sessionStorage.removeItem("inputs_fatty")
    sessionStorage.removeItem("inputs_hepatitis")
    // Additional reset logic can be added here if needed
  }

  return (
    <AnalysisContext.Provider value={{ result, input, cancerInput, fattyLiverInput, hepatitisInput, analysisOrder, setResult, setInput, setCancerInput, setFattyLiverInput, setHepatitisInput, setAnalysisOrder, reset, resetAll }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider')
  }
  return context
}