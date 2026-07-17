import requests

payload = {
    "question": "Combien de litiges sont résolus dans la base ?",
    "history": []
}

try:
    response = requests.post("http://127.0.0.1:8001/api/chat", json=payload)
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
