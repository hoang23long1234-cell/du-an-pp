import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'môi trường API', '.env'))
import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger("SlideVaultGroq")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
# KhuyÃªn dÃ¹ng llama3-70b-8192 Ä‘á»ƒ cÃ³ tÆ° duy logic tá»‘t nháº¥t hoáº·c mixtral-8x7b-32768
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-70b-8192")

def call_groq(prompt: str, system_prompt: str = "") -> str:
    """Gá»­i yÃªu cáº§u tá»›i Groq API (SiÃªu tá»‘c Ä‘á»™)."""
    if not GROQ_API_KEY:
        raise ValueError("ChÆ°a cáº¥u hÃ¬nh GROQ_API_KEY trong biáº¿n mÃ´i trÆ°á»ng.")

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 4096,
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                return choices[0]["message"].get("content", "").strip()
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        logger.error(f"Lá»—i HTTP {e.code} khi gá»i Groq API: {body}")
        raise ValueError(f"Groq API Error: {body}")
    except Exception as e:
        logger.error(f"Lá»—i khi gá»i Groq API: {e}")
        raise
    return ""


