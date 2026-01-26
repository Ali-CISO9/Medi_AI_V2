import requests
import json
import sys

# Configuration
API_URL = "http://localhost:8000/analyze"

# --- 1. Define Partial Data (Simulating a user who only filled out Cancer tab) ---
# Note: This payload has Cancer keys + Gate keys, but MISSING Hepatitis/Fatty keys.
cancer_patient_data = {
    # Gate Keys (Always present)
    "age": 45, "gender": "Male",
    "total_bilirubin": 1.2, "direct_bilirubin": 0.3,
    "alkaline_phosphotase": 85, "alamine_aminotransferase": 30,
    "aspartate_aminotransferase": 30, "total_protiens": 6.5,
    "albumin": 3.5, "albumin_and_globulin_ratio": 0.9,

    # Cancer Keys (User filled these out)
    "bmi": 25.0, "smoking": 0, "genetic_risk": 0,
    "activity": 1, "alcohol": 0, "cancer_history": 0

    # MISSING: copper, ascites, cholesterol (Hepatitis/Fatty keys)
}

def run_test(test_name, mode, payload, expect_success=True):
    print(f"--- Running Test: {test_name} (Mode: {mode}) ---")

    # Wrap in the structure your API expects
    request_body = {
        "mode": mode,
        "user_profile": payload
    }

    try:
        response = requests.post(API_URL, json=request_body)

        if response.status_code == 200:
            result = response.json()
            if expect_success:
                print("SUCCESS: Backend returned 200 OK.")
                print(f"   Analysis Type: {result.get('analysis_type', 'N/A')}")
                if 'cancer' in result.get('results', {}):
                    print("   Verified: Cancer model ran successfully.")
                    cancer_result = result['results']['cancer']
                    print(f"   Risk Level: {cancer_result['risk_level']}")
                    print(f"   Risk Percentage: {cancer_result['risk_percentage']}%")
                else:
                    print("   WARNING: Cancer results not found in response")
            else:
                print("FAILURE: Expected crash/error, but got Success.")
        else:
            if not expect_success:
                print(f"VERIFIED CRASH: Backend returned {response.status_code} as expected.")
                print(f"   Error: {response.text[:200]}...") # Show first 200 chars of error
            else:
                print(f"FAILURE: Expected Success, but got Error {response.status_code}")
                print(f"   Error: {response.text}")

    except Exception as e:
        print(f"CRITICAL ERROR: Could not connect to backend. Is it running? {e}")
    print("\n")

# --- EXECUTE TESTS ---

print("Backend Fix Verification Script")
print("=" * 50)

# TEST 1: The "Crash Test"
# We send partial data but ask for 'full' mode.
# This confirms that your backend DOES validate keys and fails when data is missing.
run_test("Crash Test (Partial Data + Full Mode)", "full", cancer_patient_data, expect_success=False)

# TEST 2: The "Fix Verification"
# We send the EXACT SAME partial data but ask for 'cancer' mode.
# This confirms that the new logic successfully ignores the missing Hepatitis keys.
run_test("Fix Verification (Partial Data + Cancer Mode)", "cancer", cancer_patient_data, expect_success=True)

print("Test Summary:")
print("- If Test 1 shows VERIFIED CRASH and Test 2 shows SUCCESS, the fix works!")
print("- If both tests succeed, the validation logic is not working.")
print("- If both tests fail, there's a connectivity or implementation issue.")