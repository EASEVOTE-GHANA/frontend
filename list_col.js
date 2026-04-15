const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../easevote/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  const eventsCount = await mongoose.connection.db.collection('events').countDocuments();
  console.log('Events Count:', eventsCount);
  
  // Sample an event to see votes/sold
  const event = await mongoose.connection.db.collection('events').findOne({ 'ticketTypes.sold': { $gt: 0 } });
  console.log('Event with Sold Tickets:', event ? event.title : 'None');
  if (event) {
    console.log('Ticket Types:', JSON.stringify(event.ticketTypes, null, 2));
  }

  process.exit(0);
}
run();
