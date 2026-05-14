const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { User, Place, Trip, FuelPrice, TollPlaza } = require('./models');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding...');

  // Upsert superadmin
  await User.findOneAndUpdate(
    { email: 'admin@roadsage.com' },
    { name: 'Super Admin', email: 'admin@roadsage.com', password: 'Admin@123', role: 'superadmin', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a', location: 'Mumbai' },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'manager@roadsage.com' },
    { name: 'Admin Manager', email: 'manager@roadsage.com', password: 'Admin@123', role: 'admin', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', location: 'Delhi' },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'mod@roadsage.com' },
    { name: 'Moderator One', email: 'mod@roadsage.com', password: 'Admin@123', role: 'moderator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', location: 'Bangalore' },
    { upsert: true }
  );

  const sampleUsers = [
    { name: 'Arjun Sharma', email: 'arjun@example.com', password: 'pass123', location: 'Jaipur' },
    { name: 'Priya Patel', email: 'priya@example.com', password: 'pass123', location: 'Ahmedabad' },
    { name: 'Rahul Kumar', email: 'rahul@example.com', password: 'pass123', location: 'Chennai' },
    { name: 'Sneha Reddy', email: 'sneha@example.com', password: 'pass123', location: 'Hyderabad' },
    { name: 'Vikram Singh', email: 'vikram@example.com', password: 'pass123', location: 'Pune' },
  ];
  for (const u of sampleUsers) await User.findOneAndUpdate({ email: u.email }, u, { upsert: true });

  const places = [
    { name: 'Marina Beach', location: 'Chennai, Tamil Nadu', image: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be', category: 'Coastal', price: '$', rating: 4.5, description: 'The second longest urban beach in the world.' },
    { name: 'Meenakshi Amman Temple', location: 'Madurai, Tamil Nadu', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220', category: 'Cultural', price: '$', rating: 4.9, description: 'Historic Hindu temple complex.' },
    { name: 'Ooty Tea Estates', location: 'Nilgiris, Tamil Nadu', image: 'https://images.unsplash.com/photo-1601921004897-b7d582836990', category: 'Nature', price: '$$', rating: 4.8, description: 'Rolling hills and lush green tea gardens.' },
    { name: 'Munnar Hills', location: 'Idukki, Kerala', image: 'https://images.unsplash.com/photo-1562802378-063ec186a863', category: 'Nature', price: '$$', rating: 4.9, description: 'Misty hills covered in tea plantations.' },
    { name: 'Kodaikanal Lake', location: 'Dindigul, Tamil Nadu', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', category: 'Nature', price: '$$', rating: 4.6, description: 'Scenic star-shaped lake in the hills.' },
    { name: 'Wonderla Chennai', location: 'Chennai, Tamil Nadu', image: 'https://images.unsplash.com/photo-1579704985284-edb7de87e5aa', category: 'Urban', price: '$$$', rating: 4.5, description: 'Premier amusement and water park.' },
    { name: 'Hampi Ruins', location: 'Vijayanagara, Karnataka', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', category: 'Cultural', price: '$', rating: 4.7, description: 'UNESCO World Heritage Site.' },
    { name: 'Goa Beaches', location: 'North Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2', category: 'Coastal', price: '$$', rating: 4.8, description: 'Famous for pristine beaches and nightlife.' },
    { name: 'Valley of Flowers', location: 'Chamoli, Uttarakhand', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', category: 'Adventure', price: '$$', rating: 4.9, description: 'UNESCO World Heritage alpine meadow.' },
    { name: 'Rann of Kutch', location: 'Kutch, Gujarat', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df', category: 'Nature', price: '$$', rating: 4.6, description: 'Largest salt marsh in the world.', isHidden: true },
  ];
  for (const p of places) await Place.findOneAndUpdate({ name: p.name }, p, { upsert: true });

  const fuelPrices = [
    { city: 'Mumbai', state: 'Maharashtra', petrol: 106.31, diesel: 92.19, cng: 75.5 },
    { city: 'Delhi', state: 'Delhi', petrol: 96.72, diesel: 89.62, cng: 74.1 },
    { city: 'Bangalore', state: 'Karnataka', petrol: 102.86, diesel: 88.94, cng: 0 },
    { city: 'Chennai', state: 'Tamil Nadu', petrol: 102.74, diesel: 94.33, cng: 0 },
    { city: 'Hyderabad', state: 'Telangana', petrol: 107.41, diesel: 95.65, cng: 0 },
    { city: 'Pune', state: 'Maharashtra', petrol: 104.91, diesel: 91.22, cng: 72.0 },
    { city: 'Ahmedabad', state: 'Gujarat', petrol: 96.63, diesel: 92.38, cng: 76.5 },
    { city: 'Kolkata', state: 'West Bengal', petrol: 106.03, diesel: 92.76, cng: 0 },
    { city: 'Jaipur', state: 'Rajasthan', petrol: 108.48, diesel: 93.72, cng: 78.0 },
    { city: 'Lucknow', state: 'Uttar Pradesh', petrol: 96.57, diesel: 89.76, cng: 85.0 },
  ];
  for (const f of fuelPrices) await FuelPrice.findOneAndUpdate({ city: f.city }, f, { upsert: true });

  const tolls = [
    { name: 'Sion-Panvel Toll', highway: 'NH-4', state: 'Maharashtra', location: { lat: 19.04, lng: 72.99 }, rates: { car: 75, lcv: 120, bus: 240, truck: 300 } },
    { name: 'Tumkur Toll', highway: 'NH-48', state: 'Karnataka', location: { lat: 13.34, lng: 77.1 }, rates: { car: 95, lcv: 155, bus: 310, truck: 390 } },
    { name: 'Palwal Toll', highway: 'NH-19', state: 'Haryana', location: { lat: 28.14, lng: 77.33 }, rates: { car: 115, lcv: 185, bus: 370, truck: 465 } },
    { name: 'Kherki Daula Toll', highway: 'NH-48', state: 'Haryana', location: { lat: 28.42, lng: 76.93 }, rates: { car: 90, lcv: 145, bus: 290, truck: 365 } },
    { name: 'Bavla Toll', highway: 'NH-947', state: 'Gujarat', location: { lat: 22.82, lng: 72.35 }, rates: { car: 65, lcv: 105, bus: 210, truck: 265 } },
  ];
  for (const t of tolls) await TollPlaza.findOneAndUpdate({ name: t.name }, t, { upsert: true });

  // Seed some trips
  const arjun = await User.findOne({ email: 'arjun@example.com' });
  const priya = await User.findOne({ email: 'priya@example.com' });
  
  const sampleTrips = [
    { title: 'North India Expedition', userId: arjun._id, status: 'ongoing', duration: '10 days', itinerary: [{},{},{},{},{},{},{},{},{},{}] },
    { title: 'Weekend in Jaipur', userId: arjun._id, status: 'planned', duration: '2 days', itinerary: [{},{}] },
    { title: 'Gujarat Coastal Drive', userId: priya._id, status: 'completed', duration: '5 days', itinerary: [{},{},{},{},{}] },
    { title: 'Rann of Kutch Visit', userId: priya._id, status: 'planned', duration: '3 days', itinerary: [{},{},{}] },
  ];
  for (const tr of sampleTrips) await Trip.findOneAndUpdate({ title: tr.title }, tr, { upsert: true });

  console.log('✅ Seed complete!');
  console.log('---');
  console.log('Superadmin: admin@roadsage.com / Admin@123');
  console.log('Admin:      manager@roadsage.com / Admin@123');
  console.log('Moderator:  mod@roadsage.com / Admin@123');
  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
