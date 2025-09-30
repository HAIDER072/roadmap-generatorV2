// Test backend connectivity
const http = require('http');

console.log('🧪 Testing backend connectivity...\n');

// Test if port 3001 is accessible
const testConnection = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Backend is reachable!');
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', parsed);
      } catch (e) {
        console.log('Response (raw):', data);
      }
    });
  });

  req.on('error', (err) => {
    console.log('❌ Cannot reach backend:');
    console.log('   Error:', err.message);
    console.log('   Code:', err.code);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Solutions:');
      console.log('   1. Make sure backend is running: npm run server');
      console.log('   2. Check Windows Firewall settings');
      console.log('   3. Try different port or disable antivirus temporarily');
    }
  });

  req.on('timeout', () => {
    console.log('⏰ Request timed out - backend might be slow or blocked');
    req.destroy();
  });

  req.end();
};

testConnection();