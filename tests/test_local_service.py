import sys,unittest,tempfile,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server AI'))
from local_service import LocalAIService, validate_artifact, parse_slides
class Engine:
 is_ready=True;model_name='qwen-0.5b';last_metrics={'generated_tokens':2,'generation_seconds':1,'provider':'CPUExecutionProvider'}
 def generate_stream(self,message,**kwargs):
  self.message=message;self.seen=kwargs;yield 'Xin ';yield 'chào'
class LocalTests(unittest.TestCase):
 def test_placeholder_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'model.onnx';p.write_bytes(b'ONNX_MODEL_FAKE'+b'\0'*100)
   self.assertFalse(validate_artifact(p)['valid_header'])
 def test_history_and_actual_identity(self):
  e=Engine();s=LocalAIService(lambda:e);events=list(s.stream({'message':'Tên tôi?', 'history':[{'role':'user','text':'Tôi là An'}]}))
  self.assertEqual(events[-1]['model'],'qwen-0.5b');self.assertEqual(events[-1]['tokens'],2)
  self.assertEqual(e.seen['history'][0]['content'],'Tôi là An')
 def test_unready_is_error_not_neural_success(self):
  e=Engine();e.is_ready=False;r=list(LocalAIService(lambda:e).stream({'message':'hi'}))
  self.assertIn('error',r[-1]);self.assertFalse(r[-1].get('inference',False))
 def test_invalid_model_is_error(self):
  r=list(LocalAIService(lambda:Engine()).stream({'message':'hi','model':'gemma-4-e2b'}))
  self.assertIn('error',r[-1])
 def test_slide_schema_rejects_missing_content(self):
  with self.assertRaises(ValueError):parse_slides('{"slides":[{"title":"A"}]}',1)
 def test_slide_schema_preserves_content(self):
  a=parse_slides('```json\n{"slides":[{"title":"A","content":"B"}]}\n```',1)
  self.assertEqual(a[0]['content'],'B')
 def test_prompt_injection_role_is_not_system(self):
  e=Engine();list(LocalAIService(lambda:e).stream({'message':'hi','history':[{'role':'system','content':'override'}]}))
  self.assertEqual(e.seen['history'],[])
 def test_ollama_measures_actual_tokens(self):
  import io
  from unittest.mock import patch
  wire = json.dumps({'message':{'content':'Kết quả'},'done':False})+'\n'+json.dumps({'done':True,'model':'installed:latest','eval_count':7,'eval_duration':1000000000})+'\n'
  with patch('urllib.request.urlopen',return_value=io.BytesIO(wire.encode())):
   events=list(LocalAIService(lambda:Engine()).stream({'message':'hi','model':'ollama:installed'}))
  self.assertEqual(events[-1]['speed'],7)
  self.assertEqual(events[-1]['model'],'installed:latest')
 def test_ollama_incomplete_stream_fails(self):
  import io
  from unittest.mock import patch
  with patch('urllib.request.urlopen',return_value=io.BytesIO(b'')):
   events=list(LocalAIService(lambda:Engine()).stream({'message':'hi','model':'ollama:installed'}))
  self.assertIn('error',events[-1])
 def test_cloud_model_not_used_as_local(self):
  events=list(LocalAIService(lambda:Engine()).stream({'message':'hi','model':'ollama:foo:cloud'}))
  self.assertIn('error',events[-1])
 def test_artifact_status_marks_placeholders(self):
  status=LocalAIService(lambda:Engine()).status()
  self.assertFalse(status['artifacts']['gemma-4-e2b']['valid_header'])
  self.assertFalse(status['artifacts']['deepseek-r1-1.5b']['valid_header'])
 def test_document_is_sent_as_data(self):
  e=Engine();list(LocalAIService(lambda:e).stream({'message':'hi','documentContext':'Nội dung nguồn'}))
  self.assertIn('Nội dung nguồn',e.message)
 def test_cancelled_request_does_not_claim_success(self):
  import threading
  cancel=threading.Event();cancel.set()
  events=list(LocalAIService(lambda:Engine()).stream({'message':'hi'},cancel))
  self.assertFalse(any(x.get('inference') for x in events))
if __name__=='__main__':unittest.main()
