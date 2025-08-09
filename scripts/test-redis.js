const Redis = require('ioredis');

async function testRedis() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
  });

  try {
    console.log('Testing Redis connection...');
    
    // Test basic operations
    await redis.set('test:key', 'test:value');
    const value = await redis.get('test:key');
    console.log('✅ Basic set/get test passed:', value);
    
    // Test JSON serialization
    const testObject = { id: '123', name: 'Test Room', status: 'waiting' };
    await redis.set('test:room', JSON.stringify(testObject));
    const retrievedObject = JSON.parse(await redis.get('test:room'));
    console.log('✅ JSON serialization test passed:', retrievedObject);
    
    // Test TTL
    await redis.setex('test:ttl', 5, 'will expire');
    const ttlValue = await redis.get('test:ttl');
    console.log('✅ TTL test passed:', ttlValue);
    
    // Test keys pattern
    await redis.set('room:test1', 'value1');
    await redis.set('room:test2', 'value2');
    const roomKeys = await redis.keys('room:*');
    console.log('✅ Keys pattern test passed:', roomKeys);
    
    // Cleanup
    await redis.del('test:key', 'test:room', 'test:ttl', 'room:test1', 'room:test2');
    console.log('✅ Cleanup completed');
    
    console.log('🎉 All Redis tests passed!');
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

testRedis();
