import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'môi trường API', '.env'))
import re
import os

path_ai = r'c:\Users\admin\Downloads\dá»± Ã¡n pp\server AI\AI.py'
with open(path_ai, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure imports are there
if 'from AIgeminipro import call_gemini' not in content:
    content = content.replace('import json', 'import json\nfrom AIgeminipro import call_gemini\nfrom classAI import SYSTEM_PROMPT, DESIGN_PLAYBOOK, INDUSTRY_GUIDE, OUTPUT_CONTRACT')

# New implementation for the slide generation
new_func = """def generate_intelligent_slide_deck(topic_prompt: str, count: int = 5) -> str:
    \"\"\"Táº¡o slide dá»±a trÃªn AI Gemini thá»±c thá»¥ hoáº·c Fallback thÃ´ng minh.\"\"\"
    count = max(3, min(count or 5, 60))
    
    # 1. Thá»­ gá»i Real AI (Gemini Pro)
    try:
        import os
        if os.getenv("GEMINI_API_KEY"):
            full_system_prompt = f"{SYSTEM_PROMPT}\\n\\n{DESIGN_PLAYBOOK}\\n\\n{INDUSTRY_GUIDE}\\n\\n{OUTPUT_CONTRACT}\\n\\nLÆ¯U Ã QUAN TRá»ŒNG: HÃ£y táº¡o Ä‘Ãºng {count} slide."
            user_prompt = f"YÃªu cáº§u táº¡o slide: {topic_prompt}"
            print(f"[SlideVault] Calling Gemini for {count} slides. Topic: {topic_prompt}")
            
            ai_response = call_gemini(user_prompt, full_system_prompt)
            if ai_response and "SLIDE_JSON:" in ai_response:
                print("[SlideVault] Gemini returned successfully.")
                return ai_response
    except Exception as e:
        print(f"[SlideVault] Gemini AI Error: {e}. Falling back to Template.")
        
    # 2. Fallback náº¿u khÃ´ng cÃ³ API key hoáº·c lá»—i (Mock thÃ´ng minh hÆ¡n 1 chÃºt nhÆ°ng váº«n lÃ  fallback)
    clean_topic = re.sub(r"^(táº¡o|hÃ£y táº¡o|láº­p dÃ n Ã½|lÃ m slide|slide vá»|bÃ i thuyáº¿t trÃ¬nh vá»|thuyáº¿t trÃ¬nh vá»)\\s*", "", topic_prompt, flags=re.IGNORECASE).strip()
    clean_topic = re.sub(r'["â€œâ€]', '', clean_topic) or "Chiáº¿n lÆ°á»£c PhÃ¡t triá»ƒn ToÃ n diá»‡n"
    
    templates = [
        {
            "category": "Tá»”NG QUAN CHIáº¾N LÆ¯á»¢C",
            "layout": "hero",
            "title": f"BÃ¡o cÃ¡o & PhÃ¢n tÃ­ch: {clean_topic}",
            "subtitle": "Há»‡ thá»‘ng AI chÆ°a Ä‘Æ°á»£c cáº¥p API Key nÃªn sá»­ dá»¥ng template máº·c Ä‘á»‹nh.",
            "bullets": [
                f"Äá» tÃ i: {clean_topic}",
                "Vui lÃ²ng cáº¥u hÃ¬nh biáº¿n mÃ´i trÆ°á»ng GEMINI_API_KEY Ä‘á»ƒ AI tá»± suy luáº­n.",
                "ThÃªm key trong file .env hoáº·c export GEMINI_API_KEY=your_key."
            ],
            "speaker_note": "Xin chÃ o, há»‡ thá»‘ng hiá»‡n Ä‘ang cháº¡y á»Ÿ cháº¿ Ä‘á»™ offline template.",
            "animation_style": "fade"
        }
    ]
    
    # Pad to required count
    for i in range(1, count):
        templates.append({
            "category": f"PHáº¦N {i+1}",
            "layout": "cards",
            "title": f"Chi tiáº¿t {i+1} - {clean_topic}",
            "subtitle": "Ná»™i dung Ä‘ang chá» AI táº¡o ra khi cÃ³ káº¿t ná»‘i.",
            "bullets": ["Vui lÃ²ng káº¿t ná»‘i API", "SlideVault VIP AI Module"],
            "animation_style": "flyIn"
        })
        
    return "SLIDE_JSON:" + json.dumps(templates, ensure_ascii=False)
"""

# Replace the old function using regex
pattern = r'def generate_intelligent_slide_deck\(.*?-> str\:.*?(?=\ndef |$)'
content = re.sub(pattern, lambda m: new_func, content, flags=re.DOTALL)

with open(path_ai, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched AI.py successfully with Real Gemini Call!')

