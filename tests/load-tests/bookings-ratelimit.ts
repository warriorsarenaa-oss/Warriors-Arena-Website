import autocannon from 'autocannon';

async function runTest() {
  console.log("Starting Load Test: Rate Limiting Verification...");
  
  const result = await autocannon({
    url: 'http://localhost:3000/api/v1/bookings',
    connections: 100,
    duration: 60,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      game_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
      duration_minutes: 30,
      player_count: 2,
      date: '2026-05-25',
      start_time: '18:00',
      customer_name: 'Load Test',
      customer_phone: '+201234567890'
    })
  });

  const successCount = result['2xx'];
  const rateLimitedCount = result['4xx'];

  console.log('--- TEST RESULTS ---');
  console.log('2xx (Success):', successCount); // Expecting ~2 or ~5 depending on exact rate limit config
  console.log('4xx (Rate Limited):', rateLimitedCount); // Expecting > 95
  
  if (rateLimitedCount > 0 && successCount < 10) {
    console.log("✅ RATE LIMITING TEST PASSED");
  } else {
    console.log("❌ RATE LIMITING TEST FAILED");
  }
}

runTest();
