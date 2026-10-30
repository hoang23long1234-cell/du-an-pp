const http = require('http');

async function testStream(prompt) {
  console.log(`\n==================================================`);
  console.log(`[TEST STREAM] Sending prompt: "${prompt}"`);
  console.log(`==================================================`);

  const payload = JSON.stringify({
    message: prompt,
    model: 'qwen-0.5b'
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/ai-chat-stream',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let fullTokens = [];
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString('utf-8');
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep last incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                process.stdout.write(data.token);
                fullTokens.push(data.token);
              }
              if (data.done) {
                console.log('\n[Stream Done]');
                console.log(`Model: ${data.model}`);
                console.log(`Total chunks: ${fullTokens.length}`);
              }
            } catch (e) {}
          }
        }
      });

      res.on('end', () => {
        resolve(fullTokens.join(''));
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  await testStream('Kể một câu chuyện cười ngắn về con mèo đi học');
  await testStream('Tại sao quả táo lại rơi xuống đất?');
}

main().catch(console.error);
