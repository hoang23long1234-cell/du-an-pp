"""
SlideVault AI Engine Launcher
Khởi động dịch vụ AI nhanh chóng và an toàn
"""
import os
import sys
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

if __name__ == "__main__":
    try:
        import uvicorn
        from AI import app, AI_HOST, AI_PORT
        print(f"[SlideVault AI] Starting server at http://{AI_HOST}:{AI_PORT}")
        uvicorn.run(app, host=AI_HOST, port=AI_PORT)
    except ImportError as e:
        print(f"[SlideVault AI] Error: Thiếu thư viện ({e}). Hãy chạy: pip install -r requirements.txt")
        sys.exit(1)
