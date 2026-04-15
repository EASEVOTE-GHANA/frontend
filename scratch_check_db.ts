import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load backend .env
dotenv.config({ path: '../easevote/.env' });

async function check() {
  const uri = process.env.MONGO_URI;
  console.log('Connecting to:', uri ? uri.split('@')[1] : 'undefined');
  
  if (!uri) throw new Error('MONGO_URI is undefined');

  try {
    await mongoose.connect(uri);
    
    const collections = await mongoose.connection.db!.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Get a handle to the purchases collection
    const Purchase = mongoose.connection.db!.collection('purchases');
    
    const total = await Purchase.countDocuments();
    const statuses = await Purchase.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    
    const volumes = await Purchase.aggregate([
        { $group: { _id: "$status", totalVolume: { $sum: "$amount" } } }
    ]).toArray();

    const sample = await Purchase.find({}).limit(2).toArray();

    console.log('Total Purchases:', total);
    console.log('Statuses:', JSON.stringify(statuses, null, 2));
    console.log('Volumes:', JSON.stringify(volumes, null, 2));
    console.log('Sample IDs:', sample.map(p => p._id));
    
    await mongoose.disconnect();
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}
check();
