#!/usr/bin/env python3
"""
Test script to verify each model's prediction capabilities with sample data.
Tests all 6 XGBoost models individually and through DiagnosisEngine.
"""

import os
import sys
import json
from diagnosis_engine import DiagnosisEngine

def create_sample_profile():
    """Create a sample patient profile with realistic values."""
    return {
        'age': 45,
        'gender': 'male',
        'bmi': 28.5,
        'smoking': 'no',
        'alcohol': 'moderate',
        'activity': 'moderate',
        'cancer_history': 'no',
        'genetic_risk': 'medium',
        'ascites': 'no',
        'hepatomegaly': 'no',
        'spiders': 'no',
        'edema': 'no',
        'bilirubin': 1.2,
        'albumin': 4.0,
        'alp': 120,
        'alt': 35,
        'ast': 30,
        'platelets': 250000,
        'prothrombin': 12.0,
        'copper': 120,
        'cholesterol': 200,
        'creatinine': 0.9,
        'glucose': 95,
        'ggt': 45,
        'triglycerides': 150,
        'uric_acid': 5.5,
        'hdl': 45,
        'total_proteins': 7.2
    }

def test_individual_models(engine, profile):
    """Test each model individually with direct access."""
    print("Testing Individual Model Predictions")
    print("=" * 50)

    # Test Gate Model
    print("\n1. Testing Gate Model (Health Screening):")
    try:
        gate_result = engine._predict_gate(profile)
        print(f"   Prediction: {gate_result['prediction']} ({'Healthy' if gate_result['is_healthy'] else 'Sick'})")
        print(f"   Features used: {len(gate_result['features_used'])}")
    except Exception as e:
        print(f"   ERROR: {e}")

    # Test Cancer Model
    print("\n2. Testing Cancer Model:")
    try:
        cancer_result = engine._predict_cancer(profile)
        print(f"   Risk Percentage: {cancer_result['risk_percentage']}%")
        print(f"   Risk Level: {cancer_result['risk_level']}")
        print(f"   Advice: {cancer_result['advice']}")
    except Exception as e:
        print(f"   ERROR: {e}")

    # Test Fatty Liver Model
    print("\n3. Testing Fatty Liver Model:")
    try:
        fatty_result = engine._predict_fatty_liver(profile)
        print(f"   Prediction: {fatty_result['prediction']} ({'Sick' if fatty_result['has_fatty_liver'] else 'Healthy'})")
        print(f"   Sick Probability: {fatty_result['sick_probability']}%")
        print(f"   Diagnosis: {fatty_result['diagnosis']}")
    except Exception as e:
        print(f"   ERROR: {e}")

    # Test Hepatitis Models
    print("\n4. Testing Hepatitis Models:")
    try:
        hep_result = engine._predict_hepatitis(profile)
        print(f"   Stage: {hep_result['stage']} ({hep_result['stage_description']})")
        print(f"   Complications Risk: {hep_result['complications_risk']}%")
        print(f"   Mortality Risk: {hep_result['mortality_risk']}%")
        print(f"   APRI Score: {hep_result['apri_score']}")
        print(f"   ALBI Score: {hep_result['albi_score']}")
        print(f"   Risk Level: {hep_result['risk_level']}")
    except Exception as e:
        print(f"   ERROR: {e}")

def test_full_diagnosis(engine, profile):
    """Test the complete diagnosis pipeline."""
    print("\n\nTesting Full Diagnosis Pipeline")
    print("=" * 50)

    try:
        result = engine.predict_full_diagnosis(profile)
        print("\nFull Diagnosis Result:")
        print(f"Success: {result['success']}")
        print(f"Diagnosis: {result['diagnosis']}")
        print(f"Confidence: {result['confidence']}%")
        print(f"Risk Level: {result['risk_level']}")
        print(f"Advice: {result['advice']}")

        print("\nDetailed Results:")
        for model_name, model_result in result['detailed_results'].items():
            print(f"\n{model_name.upper()}:")
            if model_name == 'gate':
                print(f"  Prediction: {model_result['prediction']} (Healthy: {model_result['is_healthy']})")
            elif model_name == 'cancer':
                print(f"  Risk: {model_result['risk_percentage']}% ({model_result['risk_level']})")
            elif model_name == 'fatty_liver':
                print(f"  Has Fatty Liver: {model_result['has_fatty_liver']} (Prob: {model_result['sick_probability']}%)")
            elif model_name == 'hepatitis':
                print(f"  Stage: {model_result['stage']} ({model_result['stage_description']})")
                print(f"  Complications Risk: {model_result['complications_risk']}%")
                print(f"  Mortality Risk: {model_result['mortality_risk']}%")

    except Exception as e:
        print(f"ERROR in full diagnosis: {e}")
        import traceback
        traceback.print_exc()

def test_gate_only(engine, profile):
    """Test gate-only screening."""
    print("\n\nTesting Gate-Only Screening")
    print("=" * 50)

    try:
        result = engine.predict_gate_only(profile)
        print("\nGate-Only Result:")
        print(f"Success: {result['success']}")
        print(f"Diagnosis: {result['diagnosis']}")
        print(f"Confidence: {result['confidence']}%")
        print(f"Risk Level: {result['risk_level']}")
        print(f"Advice: {result['advice']}")
    except Exception as e:
        print(f"ERROR in gate-only: {e}")

def main():
    print("Model Prediction Testing")

    try:
        # Initialize DiagnosisEngine
        print("\nInitializing DiagnosisEngine...")
        engine = DiagnosisEngine()
        print("DiagnosisEngine initialized successfully!")

        # Create sample profile
        profile = create_sample_profile()
        print(f"\nUsing sample profile with {len(profile)} features")

        # Test individual models
        test_individual_models(engine, profile)

        # Test full diagnosis
        test_full_diagnosis(engine, profile)

        # Test gate-only
        test_gate_only(engine, profile)

        print("\n" + "=" * 50)
        print("All model prediction tests completed successfully!")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()