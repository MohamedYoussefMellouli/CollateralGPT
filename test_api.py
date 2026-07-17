import requests

payload = {
  "dispute_id": "TEST-123",
  "counterparty_code": "TEST",
  "agreement_type": "ISDA",
  "currency": "USD",
  "their_exposure": 100000,
  "dispute_amount": 5000,
  "current_status_code": "OPEN",
  "dispute_age_days": 18,
  "free_text_comment": "Testing the API"
}

try:
    response = requests.post("http://127.0.0.1:8001/api/analyze-dispute", json=payload)
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
