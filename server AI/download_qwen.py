import os
import sys
import urllib.request
import time
import shutil

sys.stdout.reconfigure(encoding='utf-8')

def download_file_resumable(url, target_path, label):
    os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 400000000:
        print(f"✅ {label} already exists ({os.path.getsize(target_path)} bytes). Skipping download.")
        return

    tmp_path = target_path + '.tmp'
    downloaded = 0
    if os.path.exists(tmp_path):
        downloaded = os.path.getsize(tmp_path)
        print(f"🔄 Resuming {label} from byte {downloaded} ({downloaded / (1024*1024):.1f} MB)...")
    else:
        print(f"📥 Starting fresh download of {label}...")

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    if downloaded > 0:
        headers['Range'] = f'bytes={downloaded}-'

    req = urllib.request.Request(url, headers=headers)
    t0 = time.time()
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        content_range = resp.headers.get('Content-Range')
        if content_range:
            total = int(content_range.split('/')[-1])
        else:
            total = int(resp.headers.get('content-length', 0)) + downloaded
            
        chunk_size = 1024 * 1024 # 1 MB
        mode = 'ab' if downloaded > 0 and resp.status == 206 else 'wb'
        if mode == 'wb':
            downloaded = 0

        with open(tmp_path, mode) as f:
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                if total > 0:
                    pct = (downloaded / total) * 100
                    mb = downloaded / (1024 * 1024)
                    tot_mb = total / (1024 * 1024)
                    sys.stdout.write(f"\r  -> {label}: {pct:.1f}% ({mb:.1f}/{tot_mb:.1f} MB)")
                    sys.stdout.flush()
        print()

    if os.path.exists(target_path):
        try:
            os.remove(target_path)
        except Exception:
            pass
    os.rename(tmp_path, target_path)
    print(f"✅ Successfully saved {label} ({os.path.getsize(target_path)} bytes)!")

if __name__ == '__main__':
    base_url = "https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct/resolve/main"
    out_dir = os.path.abspath("server AI/models/qwen-0.5b")
    
    # 1. Download ONNX model (quantized 512 MB)
    target_onnx = os.path.join(out_dir, "onnx", "model_quantized.onnx")
    download_file_resumable(f"{base_url}/onnx/model_quantized.onnx", target_onnx, "Qwen2.5-0.5B ONNX Quantized")
    
    # 2. Duplicate to root model_q4.onnx and onnx/model_q4.onnx for compatibility with all loaders
    target_q4 = os.path.join(out_dir, "model_q4.onnx")
    onnx_q4 = os.path.join(out_dir, "onnx", "model_q4.onnx")
    
    print("Setting up model files...")
    shutil.copyfile(target_onnx, target_q4)
    shutil.copyfile(target_onnx, onnx_q4)
    print(f"✅ Verified files: {os.path.getsize(target_q4)} bytes ready!")
