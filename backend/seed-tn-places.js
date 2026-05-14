const mongoose = require('mongoose');
const { Place } = require('./models');
require('dotenv').config();

const data = `Tamil Nadu Tourist Places — District Wise
Chennai District
Marina Beach
Kapaleeshwarar Temple
Fort St. George
Government Museum Chennai
Coimbatore District
Marudhamalai Temple
Adiyogi Shiva Statue
VOC Park and Zoo
Siruvani Waterfalls
Madurai District
Meenakshi Amman Temple
Thirumalai Nayakkar Mahal
Alagar Kovil
Nilgiris District
Ooty Lake
Doddabetta Peak
Botanical Garden Ooty
Nilgiri Mountain Railway
Kanyakumari District
Kanyakumari Beach
Vivekananda Rock Memorial
Thiruvalluvar Statue
Thanjavur District
Brihadeeswarar Temple
Thanjavur Palace
Saraswathi Mahal Library
Tiruchirappalli District
Rockfort Temple
Srirangam Temple
Kallanai Dam
Salem District
Yercaud
1008 Lingam Temple
Kiliyur Falls
Dindigul District
Kodaikanal
Pillar Rocks
Coaker's Walk
Erode District
Bhavanisagar Dam
Kodiveri Dam
Thindal Murugan Temple
Tirunelveli District
Courtallam Falls
Nellaiappar Temple
Manimuthar Falls
Ramanathapuram District
Rameswaram
Pamban Bridge
Dhanushkodi
Cuddalore District
Pichavaram Mangrove Forest
Silver Beach
Chidambaram Nataraja Temple
Villupuram District
Gingee Fort
Auroville
Kanchipuram District
Kailasanathar Temple
Ekambareswarar Temple
Mahabalipuram
Dharmapuri District
Hogenakkal Falls
Theerthamalai Temple
Virudhunagar District
Srivilliputhur Andal Temple
Sathuragiri Hills
Nagapattinam District
Velankanni Church
Nagore Dargah
Theni District
Meghamalai
Suruli Falls
Vaigai Dam
Kanniyakumari District
Padmanabhapuram Palace
Mathur Aqueduct`;

const lines = data.split('\n').map(l => l.trim()).filter(l => l);
const places = [];
let currentDistrict = '';

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.endsWith('District')) {
    currentDistrict = line.replace(' District', '');
  } else {
    places.push({
      name: line,
      location: currentDistrict + ', Tamil Nadu',
      image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800',
      rating: parseFloat((4.0 + Math.random() * 1).toFixed(1)),
      category: 'Tourist Attraction',
      description: `${line} is a prominent tourist destination situated in ${currentDistrict}, offering visitors a rich cultural and scenic experience in Tamil Nadu.`,
      verified: true
    });
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await Place.insertMany(places);
    console.log(`Successfully seeded ${result.length} places into the database!`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error seeding DB:', err);
    process.exit(1);
  });
