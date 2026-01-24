#!/usr/bin/env python3
"""
Test script for DiagnosisEngine with sample patient data.
Tests various scenarios: healthy, cancer risk, fatty liver, hepatitis.
"""

from diagnosis_engine import DiagnosisEngine
import json

def create_sample_profiles():
    """Create sample patient profiles for testing."""
    return {
        'healthy': {
            'age': 35, 'gender': 'Male', 'bmi': 22.5, 'smoking': 'No', 'alcohol': 'No',
            'activity': 'Regular', 'cancer_history': 'No', 'genetic_risk': 'Low',
            'ascites': 'No', 'hepatomegaly': 'No', 'spiders': 'No', 'edema': 'No',
            'bilirubin': 0.8, 'albumin': 4.2, 'alp': 85, 'alt': 25, 'ast': 28,
            'platelets': 280000, 'prothrombin': 12.5, 'copper': 120, 'cholesterol': 180,
            'creatinine': 0.9, 'glucose': 90, 'ggt': 30, 'triglycerides': 120,
            'uric_acid': 5.5, 'hdl': 50, 'total_proteins': 7.5
        },
        'forced_sick': {  # High bilirubin and ALT to trigger gate
            'age': 50, 'gender': 'Male', 'bmi': 25.0, 'smoking': 'Yes', 'alcohol': 'Heavy',
            'activity': 'Low', 'cancer_history': 'No', 'genetic_risk': 'Medium',
            'ascites': 'Yes', 'hepatomegaly': 'Yes', 'spiders': 'Yes', 'edema': 'Severe',
            'bilirubin': 8.5, 'albumin': 2.8, 'alp': 180, 'alt': 200, 'ast': 150,  # High ALT
            'platelets': 120000, 'prothrombin': 18.0, 'copper': 180, 'cholesterol': 160,
            'creatinine': 1.4, 'glucose': 130, 'ggt': 200, 'triglycerides': 140,
            'uric_acid': 7.5, 'hdl': 35, 'total_proteins': 6.5
        },
        'cancer_risk': {
            'age': 65, 'gender': 'Male', 'bmi': 30.0, 'smoking': 'Yes', 'alcohol': 'Yes',
            'activity': 'Low', 'cancer_history': 'Yes', 'genetic_risk': 'High',
            'ascites': 'No', 'hepatomegaly': 'No', 'spiders': 'No', 'edema': 'No',
            'bilirubin': 1.2, 'albumin': 3.8, 'alp': 95, 'alt': 35, 'ast': 32,
            'platelets': 250000, 'prothrombin': 13.0, 'copper': 130, 'cholesterol': 220,
            'creatinine': 1.1, 'glucose': 110, 'ggt': 45, 'triglycerides': 180,
            'uric_acid': 6.2, 'hdl': 40, 'total_proteins': 7.2
        },
        'fatty_liver': {
            'age': 45, 'gender': 'Female', 'bmi': 28.0, 'smoking': 'No', 'alcohol': 'Moderate',
            'activity': 'Low', 'cancer_history': 'No', 'genetic_risk': 'Medium',
            'ascites': 'No', 'hepatomegaly': 'Yes', 'spiders': 'No', 'edema': 'Slight',
            'bilirubin': 1.5, 'albumin': 3.9, 'alp': 110, 'alt': 85, 'ast': 65,
            'platelets': 220000, 'prothrombin': 13.5, 'copper': 125, 'cholesterol': 250,
            'creatinine': 1.0, 'glucose': 105, 'ggt': 80, 'triglycerides': 220,
            'uric_acid': 6.0, 'hdl': 45, 'total_proteins': 7.3
        },
        'hepatitis': {
            'age': 50, 'gender': 'Male', 'bmi': 25.0, 'smoking': 'Yes', 'alcohol': 'Heavy',
            'activity': 'Moderate', 'cancer_history': 'No', 'genetic_risk': 'Medium',
            'ascites': 'Yes', 'hepatomegaly': 'Yes', 'spiders': 'Yes', 'edema': 'Severe',
            'bilirubin': 3.5, 'albumin': 2.8, 'alp': 180, 'alt': 120, 'ast': 150,
            'platelets': 120000, 'prothrombin': 18.0, 'copper': 180, 'cholesterol': 160,
            'creatinine': 1.4, 'glucose': 130, 'ggt': 200, 'triglycerides': 140,
            'uric_acid': 7.5, 'hdl': 35, 'total_proteins': 6.5
        }
    }

def test_diagnosis_engine():
    """Test DiagnosisEngine with various patient profiles."""
    print("Testing DiagnosisEngine")
    print("=" * 50)

    try:
        # Initialize engine
        engine = DiagnosisEngine()
        print("[OK] DiagnosisEngine initialized successfully")
    except Exception as e:
        print(f"[FAIL] Failed to initialize DiagnosisEngine: {e}")
        return

    # Test profiles
    profiles = create_sample_profiles()

    for profile_name, profile in profiles.items():
        print(f"\nTesting {profile_name.upper()} profile:")
        print("-" * 30)

        try:
            # Test gate-only first
            gate_result = engine.predict_gate_only(profile)
            print(f"Gate-Only Diagnosis: {gate_result['diagnosis']}")
            print(f"Gate-Only Confidence: {gate_result['confidence']}%")
            print(f"Gate-Only Risk Level: {gate_result['risk_level']}")
            print(f"Gate-Only Advice: {gate_result['advice']}")
            gate = gate_result['detailed_results']['gate']
            print(f"Gate Prediction: {'Healthy' if gate['is_healthy'] else 'At Risk'} (prediction: {gate['prediction']})")

            # Then full diagnosis
            result = engine.predict_full_diagnosis(profile)
            print(f"Full Diagnosis: {result['diagnosis']}")
            print(f"Full Confidence: {result['confidence']}%")
            print(f"Full Risk Level: {result['risk_level']}")
            print(f"Full Advice: {result['advice']}")

            # Show detailed results
            detailed = result['detailed_results']
            if 'cancer' in detailed:
                print(f"Cancer Risk: {detailed['cancer']['risk_percentage']}%")
            if 'fatty_liver' in detailed:
                print(f"Fatty Liver: {'Yes' if detailed['fatty_liver']['has_fatty_liver'] else 'No'}")
            if 'hepatitis' in detailed:
                hep = detailed['hepatitis']
                print(f"Hepatitis Stage: {hep['stage']} ({hep['stage_description']})")
                print(f"Mortality Risk: {hep['mortality_risk']}%")

        except Exception as e:
            print(f"[ERROR] Failed to process {profile_name}: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 50)
    print("[SUCCESS] All tests completed")

if __name__ == "__main__":
    test_diagnosis_engine()