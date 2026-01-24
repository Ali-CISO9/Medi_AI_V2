"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface AnalysisResult {
  diagnosis: string
  confidence: number
  advice: string
}

interface AnalysisInput {
  ALT: string
  AST: string
  Bilirubin: string
  GGT: string
  Age: string
  Gender: string
  AlkPhos: string
  TP: string
  ALB: string
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
  setResult: (result: AnalysisResult | null) => void
  setInput: (input: AnalysisInput | null) => void
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

  const reset = () => {
    setResult(null)
    setInput(null)
  }

  const resetAll = () => {
    setResult(null)
    setInput(null)
    // Additional reset logic can be added here if needed
  }

  return (
    <AnalysisContext.Provider value={{ result, input, setResult, setInput, reset, resetAll }}>
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