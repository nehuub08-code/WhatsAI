import asyncio
from app.main import app, on_startup
from app.database import SessionLocal
from fastapi.testclient import TestClient

def run_tests():
    print("Testing backend startup...")
    on_startup()

    client = TestClient(app)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] GET /api/health passed:", res.json()["status"])

    # 2. Login
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@12345"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] POST /api/auth/login passed (JWT token issued)")

    # 3. Auth Me
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200, f"Auth me failed: {res.text}"
    print("[OK] GET /api/auth/me passed, user:", res.json()["username"])

    # 4. Dashboard
    res = client.get("/api/dashboard", headers=headers)
    assert res.status_code == 200, f"Dashboard failed: {res.text}"
    data = res.json()
    print("[OK] GET /api/dashboard passed. Total users:", data["kpi"]["total_users"], "Avg latency:", data["kpi"]["avg_response_time_ms"])

    # 5. Users list
    res = client.get("/api/users", headers=headers)
    assert res.status_code == 200, f"Users failed: {res.text}"
    users = res.json()
    print(f"[OK] GET /api/users passed ({len(users)} users loaded)")

    # 6. Messages list
    res = client.get("/api/messages", headers=headers)
    assert res.status_code == 200, f"Messages failed: {res.text}"
    msgs = res.json()
    print(f"[OK] GET /api/messages passed ({len(msgs)} messages loaded)")

    # 7. Webhook GET verification
    res = client.get("/webhook?hub.mode=subscribe&hub.verify_token=whatsai_secure_verify_token_2026&hub.challenge=12345678")
    assert res.status_code == 200, f"Webhook GET verification failed: {res.text}"
    assert res.text == "12345678", "Challenge did not match"
    print("[OK] GET /webhook challenge verification passed")

    # 8. WhatsApp Simulator incoming message test
    res = client.post(
        "/api/simulator/incoming",
        headers=headers,
        json={
            "phone": "+1 (555) 999-0000",
            "name": "Live Test Contact",
            "message": "Hello WhatsAI! What is the pricing plan?"
        }
    )
    assert res.status_code == 200, f"Simulator failed: {res.text}"
    sim_data = res.json()
    assert sim_data["success"] is True
    print(f"[OK] POST /api/simulator/incoming passed! AI reply latency: {sim_data['latency_ms']}ms")

    # 9. Settings GET and PUT
    res = client.get("/api/settings", headers=headers)
    assert res.status_code == 200
    res = client.put("/api/settings", headers=headers, json={"context_limit": 12, "temperature": 0.65})
    assert res.status_code == 200
    assert res.json()["context_limit"] == 12
    print("[OK] GET & PUT /api/settings passed (context_limit updated)")

    # 10. Analytics
    res = client.get("/api/analytics", headers=headers)
    assert res.status_code == 200
    print(f"[OK] GET /api/analytics passed. Daily points: {len(res.json()['daily_messages'])}")

    # 11. Export CSV
    res = client.get("/api/export/csv", headers=headers)
    assert res.status_code == 200
    assert "Message Content" in res.text
    print("[OK] GET /api/export/csv passed")

    print("\nALL 11 BACKEND API TESTS COMPLETED AND VERIFIED!")

if __name__ == "__main__":
    run_tests()
