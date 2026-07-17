import requests
import time

print("Vérification que le serveur backend est démarré...")

# Attendre que le serveur soit prêt
max_retries = 10
for i in range(max_retries):
    try:
        response = requests.get("http://127.0.0.1:8001/docs", timeout=2)
        print("✓ Serveur backend détecté")
        break
    except:
        if i == max_retries - 1:
            print("✗ Le serveur backend n'est pas démarré!")
            print("Veuillez d'abord lancer: python app.py")
            exit(1)
        print(f"Attente du serveur... ({i+1}/{max_retries})")
        time.sleep(2)

print("\nRéinitialisation de la base de données ChromaDB...")
try:
    response = requests.post("http://127.0.0.1:8001/api/admin/seed-knowledge", timeout=60)
    print(f"\n✓ Status: {response.status_code}")
    print(f"✓ Response: {response.json()}")
    print("\n✓ Base de données réinitialisée avec succès!")
except Exception as e:
    print(f"\n✗ Error: {e}")
