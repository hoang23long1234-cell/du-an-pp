"""
SlideVault Real Local Neural Engine
===================================
100% On-Device Neural Inference using ONNX Runtime & Tokenizers
No Cloud API keys, no internet dependency, dynamic token generation.
"""

import os
import sys

# Configure UTF-8 stdout/stderr on Windows to prevent UnicodeEncodeError in path names
try:
    if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

import time
import json
import threading
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

class LocalNeuralEngine:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.is_ready = False
        self.inference_lock = threading.RLock()
        self.last_metrics = {}
        self.model_name = "qwen-0.5b"
        self.sess = None
        self.tokenizer = None
        self.num_layers = 24
        self.num_heads = 2
        self.head_dim = 64
        self.eos_tokens = set([151643, 151645])
        self._init_model()

    def _init_model(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        qwen_dir = os.path.join(base_dir, "models", "qwen-0.5b")
        qwen_onnx = os.path.join(qwen_dir, "model_q4.onnx")
        qwen_tok = os.path.join(qwen_dir, "tokenizer.json")

        if self._valid_artifact(qwen_onnx) and os.path.exists(qwen_tok):
            try:
                print("[NeuralEngine] Loading Qwen 2.5 0.5B ONNX...")
                opts = ort.SessionOptions()
                opts.intra_op_num_threads = 2
                opts.inter_op_num_threads = 1
                opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
                opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

                self.tokenizer = Tokenizer.from_file(qwen_tok)
                self.sess = ort.InferenceSession(qwen_onnx, sess_options=opts)
                self.model_name = "qwen-0.5b"
                self.num_layers = 24
                self.num_heads = 2
                self.head_dim = 64
                self.eos_tokens = set([151643, 151645])
                self.is_ready = True
                print("[NeuralEngine] Qwen 2.5 0.5B loaded successfully and ready!")
                return
            except Exception as e:
                print(f"[NeuralEngine] Failed to load Qwen 2.5 0.5B: {type(e).__name__} {e}")

        # Fallback to SmolLM-135M
        smol_dir = os.path.join(base_dir, "models", "smollm-135m")
        smol_onnx = os.path.join(smol_dir, "model_q4.onnx")
        smol_tok = os.path.join(smol_dir, "tokenizer.json")

        if self._valid_artifact(smol_onnx) and os.path.exists(smol_tok):
            try:
                print("[NeuralEngine] Loading SmolLM-135M fallback...")
                opts = ort.SessionOptions()
                opts.intra_op_num_threads = min(8, os.cpu_count() or 4)
                self.tokenizer = Tokenizer.from_file(smol_tok)
                self.sess = ort.InferenceSession(smol_onnx, sess_options=opts)
                self.model_name = "smollm-135m"
                self.num_layers = 30
                self.num_heads = 3
                self.head_dim = 64
                self.eos_tokens = set([0, 2])
                self.is_ready = True
                print("[NeuralEngine] SmolLM-135M fallback loaded successfully!")
                return
            except Exception as e:
                print(f"[NeuralEngine] Failed to load SmolLM fallback: {type(e).__name__} {e}")

        self.is_ready = False

    def _sample_token(self, logits, generated_tokens, temperature=0.35, top_p=0.85, repetition_penalty=1.05):
        if temperature <= 0:
            return int(np.argmax(logits))
        # Repetition penalty
        for tid in set(generated_tokens):
            if logits[tid] > 0:
                logits[tid] /= repetition_penalty
            else:
                logits[tid] *= repetition_penalty

        # Temperature
        logits = logits / max(temperature, 1e-5)

        # Softmax
        probs = np.exp(logits - np.max(logits))
        probs = probs / np.sum(probs)

        # Nucleus (top-p)
        sorted_indices = np.argsort(probs)[::-1]
        sorted_probs = probs[sorted_indices]
        cumulative_probs = np.cumsum(sorted_probs)

        cutoff = cumulative_probs > top_p
        if np.any(cutoff):
            cutoff_idx = max(1, np.argmax(cutoff) + 1)
            sorted_indices = sorted_indices[:cutoff_idx]
            sorted_probs = sorted_probs[:cutoff_idx]
            sorted_probs = sorted_probs / np.sum(sorted_probs)

        return int(np.random.choice(sorted_indices, p=sorted_probs))

    @staticmethod
    def _valid_artifact(path):
        from local_service import validate_artifact
        return validate_artifact(path)['valid_header']

    def format_chat_prompt(self, message, system_prompt=None, history=None):
        system = system_prompt or "Bạn là trợ lý tiếng Việt. Trả lời chính xác, ngắn gọn."
        messages = [{'role': 'system', 'content': system}, *(history or []), {'role': 'user', 'content': message}]
        if self.model_name == 'qwen-0.5b':
            return ''.join(f"<|im_start|>{m['role']}\n{m['content']}<|im_end|>\n" for m in messages) + '<|im_start|>assistant\n'
        return ''.join(f"<|im_start|>{m['role']}\n{m['content']}<|im_end|>\n" for m in messages) + '<|im_start|>assistant\n'

    def generate(self, message, max_new_tokens=50, temperature=0.5, system_prompt=None):
        chunks = []
        for token_text in self.generate_stream(message, max_new_tokens=max_new_tokens, temperature=temperature, system_prompt=system_prompt):
            chunks.append(token_text)
        return "".join(chunks)

    def generate_stream(self, message, max_new_tokens=180, temperature=0.5, system_prompt=None, history=None, cancel=None):
        with self.inference_lock:
            yield from self._generate_stream(message, max_new_tokens, temperature, system_prompt, history, cancel)

    def _generate_stream(self, message, max_new_tokens, temperature, system_prompt, history, cancel):
        if not self.is_ready or self.sess is None or self.tokenizer is None:
            raise RuntimeError("Local model is not ready")

        formatted = self.format_chat_prompt(message, system_prompt=system_prompt, history=history)
        tokens = self.tokenizer.encode(formatted).ids
        if len(tokens) > 4096:
            raise ValueError("Context exceeds 4096 tokens; shorten the conversation or document.")
        started = time.perf_counter()
        self.last_metrics = {}
        input_ids = np.array([tokens], dtype=np.int64)

        pasts = {}
        for i in range(self.num_layers):
            pasts[f'past_key_values.{i}.key'] = np.zeros((1, self.num_heads, 0, self.head_dim), dtype=np.float32)
            pasts[f'past_key_values.{i}.value'] = np.zeros((1, self.num_heads, 0, self.head_dim), dtype=np.float32)

        current_input_ids = input_ids
        past_seq_len = 0
        generated = []
        accumulated_text = ""

        for step in range(max(1, min(2048, max_new_tokens))):
            if cancel and cancel.is_set():
                break
            seq_len = current_input_ids.shape[1]
            total_seq_len = past_seq_len + seq_len

            feed = {
                'input_ids': current_input_ids,
                'attention_mask': np.ones((1, total_seq_len), dtype=np.int64),
                'position_ids': np.arange(past_seq_len, total_seq_len, dtype=np.int64).reshape(1, seq_len),
                **pasts
            }

            try:
                outputs = self.sess.run(None, feed)
            except Exception as e:
                raise RuntimeError(f"ONNX inference failed: {e}") from e

            logits = outputs[0][0, -1, :]

            for i in range(self.num_layers):
                pasts[f'past_key_values.{i}.key'] = outputs[1 + i * 2]
                pasts[f'past_key_values.{i}.value'] = outputs[2 + i * 2]

            next_id = self._sample_token(logits, generated, temperature=temperature)

            if next_id in self.eos_tokens:
                break

            generated.append(next_id)
            new_text = self.tokenizer.decode(generated)
            diff = new_text[len(accumulated_text):]
            accumulated_text = new_text

            if diff:
                yield diff

            current_input_ids = np.array([[next_id]], dtype=np.int64)
            past_seq_len = total_seq_len

        self.last_metrics = {"generated_tokens": len(generated), "generation_seconds": time.perf_counter()-started,
                             "provider": self.sess.get_providers()[0], "prompt_tokens": len(tokens)}

# Global helper
neural_engine = LocalNeuralEngine.get_instance()
