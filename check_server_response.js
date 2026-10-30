const http = require('http');

http.get('http://127.0.0.1:3000/index.html', res => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Data length:', data.length);
    console.log('Contains saas-layout-wrapper:', data.includes('saas-layout-wrapper'));
    console.log('Contains saasAppSidebar:', data.includes('saasAppSidebar'));
    console.log('First 300 chars:', data.slice(0, 300));
  });
}).on('error', err => {
  console.error('Fetch error:', err.message);
});
