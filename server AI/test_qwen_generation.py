import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import time
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

model_dir = "server AI/models/qwen-0.5b"
tokenizer_path = os.path.join(model_dir, "tokenizer.json")
model_path = os.path.join(model_dir, "model_q4.onnx")

tokenizer = Tokenizer.from_file(tokenizer_path)

# Optimize ONNX Runtime session for CPU (intra_op_num_threads)
opts = ort.SessionOptions()
opts.intra_op_num_threads = min(8, os.cpu_count() or 4)
opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

sess = ort.InferenceSession(model_path, sess_options=opts)

# Get special token IDs
eos_tokens = set([151643, 151645]) # <|endoftext|>, <|im_end|>

def sample_next_token(logits, generated_tokens, temperature=0.7, top_p=0.85, repetition_penalty=1.2):
    # Apply repetition penalty
    for token_id in set(generated_tokens):
        if logits[token_id] > 0:
            logits[token_id] /= repetition_penalty
        else:
            logits[token_id] *= repetition_penalty

    # Temperature
    logits = logits / max(temperature, 1e-5)
    
    # Softmax
    probs = np.exp(logits - np.max(logits))
    probs = probs / np.sum(probs)
    
    # Top-p (nucleus)
    sorted_indices = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_indices]
    cumulative_probs = np.cumsum(sorted_probs)
    
    # Cutoff
    cutoff = cumulative_probs > top_p
    if np.any(cutoff):
        # Keep at least 1 token
        cutoff_idx = max(1, np.argmax(cutoff) + 1)
        sorted_indices = sorted_indices[:cutoff_idx]
        sorted_probs = sorted_probs[:cutoff_idx]
        sorted_probs = sorted_probs / np.sum(sorted_probs)
    
    return int(np.random.choice(sorted_indices, p=sorted_probs))

def generate(prompt_text, max_new_tokens=60, temperature=0.7, repetition_penalty=1.2):
    formatted = f"<|im_start|>system\nBạn là trợ lý AI thông minh của SlideVault. Hãy trả lời tự nhiên, thân thiện và hữu ích bằng tiếng Việt.<|im_end|>\n<|im_start|>user\n{prompt_text}<|im_end|>\n<|im_start|>assistant\n"
    
    tokens = tokenizer.encode(formatted).ids
    input_ids = np.array([tokens], dtype=np.int64)
    
    num_layers = 24
    num_heads = 2
    head_dim = 64
    
    pasts = {}
    for i in range(num_layers):
        pasts[f'past_key_values.{i}.key'] = np.zeros((1, num_heads, 0, head_dim), dtype=np.float32)
        pasts[f'past_key_values.{i}.value'] = np.zeros((1, num_heads, 0, head_dim), dtype=np.float32)
        
    t0 = time.time()
    current_input_ids = input_ids
    past_seq_len = 0
    generated = []
    
    for step in range(max_new_tokens):
        seq_len = current_input_ids.shape[1]
        total_seq_len = past_seq_len + seq_len
        
        feed = {
            'input_ids': current_input_ids,
            'attention_mask': np.ones((1, total_seq_len), dtype=np.int64),
            'position_ids': np.arange(past_seq_len, total_seq_len, dtype=np.int64).reshape(1, seq_len),
            **pasts
        }
        
        outputs = sess.run(None, feed)
        logits = outputs[0][0, -1, :] # [vocab_size]
        
        for i in range(num_layers):
            pasts[f'past_key_values.{i}.key'] = outputs[1 + i*2]
            pasts[f'past_key_values.{i}.value'] = outputs[2 + i*2]
            
        next_id = sample_next_token(logits, generated, temperature=temperature, repetition_penalty=repetition_penalty)
        
        if next_id in eos_tokens:
            break
            
        generated.append(next_id)
        current_input_ids = np.array([[next_id]], dtype=np.int64)
        past_seq_len = total_seq_len

    text = tokenizer.decode(generated)
    return text

if __name__ == '__main__':
    for p in [
        "Kể một câu chuyện cười cực ngắn về chú mèo đi thi đại học.",
        "Tại sao lá cây lại có màu xanh?"
    ]:
        print(f"\nUser: {p}")
        reply = generate(p, max_new_tokens=70)
        print("AI Local:", reply)
