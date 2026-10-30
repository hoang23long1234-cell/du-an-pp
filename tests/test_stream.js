async function testStream() {
  const res = await fetch('http://127.0.0.1:3000/api/ai-chat-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'chào bạn nè', assistant: 'neko' })
  });
  console.log('Stream status:', res.status, res.headers.get('content-type'));
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let chunks = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks++;
    const text = decoder.decode(value);
    if (chunks <= 3 || text.includes('done')) {
      console.log(`[Chunk ${chunks}]:`, text.trim().slice(0, 80));
    }
  }
  console.log('SUCCESS: Stream completed with', chunks, 'chunks!');
}
testStream().catch(console.error);
