const mongoose = require('mongoose');
require('dotenv').config();

const placeSchema = new mongoose.Schema({
  name: String,
  location: String,
  category: String,
  price: String,
  rating: String,
  description: String,
  image: String,
  isHidden: { type: Boolean, default: false }
});
const Place = mongoose.model('Place', placeSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const places = await Place.find();
  console.log("Places count:", places.length);
  if(places.length === 0) {
    console.log("Database is empty! Inserting mock data...");
    await Place.insertMany([
      { name: 'Munnar Tea Gardens', location: 'Kerala, India', category: 'Nature', price: '₹4000/night', rating: '4.8', description: 'Lush green tea estates in the rolling hills of Munnar.', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80', isHidden: false },
      { name: 'Gokarna Beaches', location: 'Karnataka, India', category: 'Coastal', price: '₹2500/night', rating: '4.7', description: 'Pristine beaches and relaxed vibes on the Om Beach coast.', image: 'https://images.unsplash.com/photo-1559540868-63ca3f099205?auto=format&fit=crop&w=600&q=80', isHidden: false },
      { name: 'Ooty Hills', location: 'Tamil Nadu, India', category: 'Adventure', price: '₹3500/night', rating: '4.6', description: 'Queen of hill stations with pine forests and lakes.', image: 'https://images.unsplash.com/photo-1589197331516-4d84b72aaef4?auto=format&fit=crop&w=600&q=80', isHidden: false },
      { name: 'Varanasi Ghats', location: 'Uttar Pradesh, India', category: 'Cultural', price: '₹1500/night', rating: '4.9', description: 'Ancient city on the banks of the sacred Ganges.', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80', isHidden: false },
      { name: 'Secret Cove', location: 'Goa, India', category: 'Coastal', price: '₹3000/night', rating: '4.9', description: 'A hidden beach away from the tourist crowds.', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80', isHidden: true }
    ]);
    console.log("Mock data inserted.");
  }
  process.exit(0);
}
run();
