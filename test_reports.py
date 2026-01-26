import requests
import json

url = "http://localhost:8000/reports"
payload = {
    "patient_id": 39,
    "diagnosis": "COMPLEX SICK TEST",
    "confidence": 88.5,
    "advice": "Test advice",
    "risk_level": "high",
    "detailed_results": {
        "gate_data": {"prediction": 0, "probability": 0.9},
        "cancer": {"risk_percentage": 75, "biomarkers": ["AFP"]},
        "fatty_liver": {"detected": True, "grade": "severe"},
        "hepatitis": {"stage": 2, "status": "active"}
    }
}

headers = {"Content-Type": "application/json"}

response = requests.post(url, data=json.dumps(payload), headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")