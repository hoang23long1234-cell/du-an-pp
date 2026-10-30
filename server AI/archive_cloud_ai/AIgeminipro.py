import os
import json
import logging
import urllib.request
import urllib.error
from dotenv import load_dotenv

# Load môi trường API và root .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'môi trường API', '.env'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

"""
SlideVault Gemini Multi-Tier Frontier Engine Integration
Tích hợp Google Gemini 4 Argon, 3.8 Flash, 2.5 Flash & 2.5 Pro cho hệ thống tạo Slide AI.
"""

logger = logging.getLogger("SlideVaultGemini")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-4-argon").strip()

def call_gemini(prompt: str, system_prompt: str = "", model: str = "") -> str:
    """Gửi yêu cầu tới Google Gemini API với cơ chế tự động chuyển tầng dự phòng (Cascading Fallback)."""
    api_key = GEMINI_API_KEY
    if not api_key:
        raise ValueError("Chưa cấu hình GEMINI_API_KEY trong biến môi trường.")

    primary_model = model or DEFAULT_MODEL or "gemini-4-argon"
    cascade_models = [
        primary_model,
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro"
    ]
    # Remove duplicates preserving order
    seen = set()
    models_to_try = [m for m in cascade_models if not (m in seen or seen.add(m))]

    last_error = None

    for candidate_model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate_model}:generateContent?key={api_key}"
        
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": system_prompt}]})
            contents.append({"role": "model", "parts": [{"text": "Đã hiểu chỉ dẫn hệ thống SlideVault."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        generation_config = {
            "temperature": 0.35,
            "maxOutputTokens": 32768,
        }
        if candidate_model == "gemini-4-argon":
            generation_config["thinkingConfig"] = {"thinkingLevel": "standard"}

        payload = {
            "contents": contents,
            "generationConfig": generation_config
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=35) as response:
                data = json.loads(response.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts:
                        text = parts[0].get("text", "").strip()
                        if text:
                            logger.info(f"[Gemini Cascade] Thành công với model {candidate_model}")
                            return text
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='ignore')
            logger.warning(f"[Gemini Cascade] Model {candidate_model} trả về lỗi HTTP {e.code}: {err_body}. Đang thử tầng dự phòng tiếp theo...")
            last_error = e
        except Exception as e:
            logger.warning(f"[Gemini Cascade] Model {candidate_model} lỗi kết nối: {str(e)}. Đang thử tầng tiếp theo...")
            last_error = e

    if last_error:
        raise last_error
    raise RuntimeError("Không nhận được phản hồi hợp lệ từ bất kỳ model Gemini nào trong chuỗi fallback.")
