async function testApiQueue() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nurse.sarah', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login success:', loginData.success, 'Token:', loginData.data?.token?.slice(0, 20) + '...');

  const token = loginData.data.token;
  const queueRes = await fetch('http://localhost:5000/api/queue', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const queueData = await queueRes.json();
  console.log('GET /api/queue response success:', queueData.success);
  console.log('Queue data length:', queueData.data?.length);
  console.log('Queue items:', queueData.data);
}

testApiQueue().catch(console.error);
