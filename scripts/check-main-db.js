const { MongoClient } = require('mongodb');

async function checkMainDatabase() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/sea-battle';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Подключение к основной базе данных успешно');
    
    // Extract DB name from URI or default to 'sea-battle'
    const dbName = (() => {
      try {
        const url = new URL(uri);
        const pathname = url.pathname?.replace(/^\//, '');
        return pathname || 'sea-battle';
      } catch {
        return 'sea-battle';
      }
    })();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('📋 Коллекции в основной базе:', collections.map(c => c.name));
    
    // Проверяем коллекцию пользователей
    const users = db.collection('users');
    const userCount = await users.countDocuments();
    console.log(`👥 Количество пользователей в основной базе: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка подключения к основной базе данных:', error.message);
  } finally {
    await client.close();
  }
}

checkMainDatabase();
