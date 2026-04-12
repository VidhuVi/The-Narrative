import firebase_admin
from firebase_admin import credentials, firestore
import os

if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("firebase-admin-key.json")
        firebase_admin.initialize_app(cred, name="ai-studio-121b44f7-c5f0-4fdf-ae40-1f66e9202d2f")
    except Exception as e:
        print("Could not init firebase:", e)

try:
    db = firestore.client(app=firebase_admin.get_app("ai-studio-121b44f7-c5f0-4fdf-ae40-1f66e9202d2f"))
    db._database = "ai-studio-121b44f7-c5f0-4fdf-ae40-1f66e9202d2f"
    meetings = db.collection("meetings").stream()
    count = 0
    for doc in meetings:
        data = doc.to_dict()
        summary = data.get("summary")
        if isinstance(summary, list):
            new_sum = "\n".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in summary])
            doc.reference.update({"summary": new_sum})
            count += 1
        elif isinstance(summary, dict):
            new_sum = summary.get("text", "")
            doc.reference.update({"summary": new_sum})
            count += 1
    print(f"Fixed {count} meetings.")
except Exception as e:
    print("Error:", e)
