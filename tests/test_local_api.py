import sys,types,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from test_local_service import Engine
sys.modules['neural_engine']=types.SimpleNamespace(neural_engine=Engine())
from fastapi.testclient import TestClient
from AI import app
class APITests(unittest.TestCase):
 def setUp(self):self.client=TestClient(app)
 def test_status_exposes_actual_model(self):
  r=self.client.get('/api/local/status');self.assertEqual(r.status_code,200)
  self.assertEqual(r.json()['loaded_model'],'qwen-0.5b')
 def test_chat_uses_inference_service(self):
  r=self.client.post('/api/chat',json={'message':'Xin chào','model':'qwen-0.5b'})
  self.assertEqual(r.status_code,200);self.assertEqual(r.json()['reply'],'Xin chào');self.assertTrue(r.json()['inference'])
 def test_invalid_model_returns_error(self):
  r=self.client.post('/api/chat',json={'message':'Xin chào','model':'gemma-4-e2b'})
  self.assertEqual(r.status_code,503)
 def test_stream_has_done_metadata(self):
  r=self.client.post('/api/ai-chat-stream',json={'message':'Xin chào','model':'qwen-0.5b'})
  self.assertEqual(r.status_code,200);self.assertIn('"inference": true',r.text)
  self.assertIn('"tokens": 2',r.text)
 def test_empty_request_is_validation_error(self):
  r=self.client.post('/api/chat',json={'message':''});self.assertEqual(r.status_code,422)
if __name__=='__main__':unittest.main()
