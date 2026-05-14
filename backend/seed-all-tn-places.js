const mongoose = require('mongoose');
const { Place } = require('./models');
require('dotenv').config();

// Category assignment based on keywords in the place name
function getCategory(name) {
  const n = name.toLowerCase();
  if (/beach|coast|bay|cove|sea|shore|marina/.test(n)) return 'Beach';
  if (/temple|kovil|church|dargah|basilica|mosque|shrine|murugan|shiva|amman|perumal|nataraja|arunachaleswarar|brihadeeswarar|srirangam|kapaleeshwarar|ekambareswarar|meenakshi|thyagaraja|nellaiappar|mayuranathaswamy|vaitheeswaran|pasupathieswarar|kailasanathar|varadharaja/.test(n)) return 'Temple';
  if (/falls|waterfall|cascade/.test(n)) return 'Waterfall';
  if (/hill|peak|ooty|kodaikanal|yercaud|yelagiri|kolli|meghamalai|kalvarayan|kurangani|doddabetta|valparai|coonoor/.test(n)) return 'Hill Station';
  if (/dam|lake|reservoir|mangrove|forest|wildlife|bird|park|sanctuary|botanical|nature/.test(n)) return 'Nature';
  if (/fort|palace|mahal|museum|library|monument|rock memorial|heritage|aqueduct|fossil|pillar rocks/.test(n)) return 'Heritage';
  if (/zoo|aquarium/.test(n)) return 'Nature';
  if (/bridge|railway|road/.test(n)) return 'Landmark';
  if (/rock|cave|sittannavasal|mahabalipuram|kalugumalai/.test(n)) return 'Heritage';
  if (/auroville|chettinad|tranquebar/.test(n)) return 'Cultural';
  return 'Cultural';
}

// Better description generator
function getDescription(name, district) {
  const cat = getCategory(name);
  const descs = {
    'Beach': `${name} is a stunning coastal destination in ${district}, known for its pristine sands and scenic sea views. A perfect escape for nature lovers and beach enthusiasts.`,
    'Temple': `${name} is an ancient and revered temple in ${district}, showcasing Dravidian architecture and rich cultural heritage of Tamil Nadu.`,
    'Waterfall': `${name} in ${district} is a breathtaking cascade surrounded by lush greenery. A popular spot for picnics, trekking, and nature photography.`,
    'Hill Station': `${name} in ${district} is a serene hill retreat offering cool weather, panoramic views, and a refreshing escape from city life.`,
    'Nature': `${name} in ${district} is a beautiful natural reserve offering a tranquil environment, rich biodiversity, and scenic landscapes.`,
    'Heritage': `${name} in ${district} is a historically significant landmark reflecting the glorious past of Tamil Nadu with impressive architecture and historical artifacts.`,
    'Landmark': `${name} in ${district} is a prominent landmark that draws visitors with its engineering marvel and scenic surroundings.`,
    'Cultural': `${name} in ${district} is a vibrant cultural destination offering a unique glimpse into the traditions and lifestyle of Tamil Nadu.`,
  };
  return descs[cat] || `${name} is a must-visit destination in ${district}, Tamil Nadu.`;
}

// Category-specific Unsplash images
function getImage(name) {
  const cat = getCategory(name);
  const images = {
    'Beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'Temple': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    'Waterfall': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    'Hill Station': 'https://images.unsplash.com/photo-1536625737227-92a1fc042e0f?auto=format&fit=crop&w=800&q=80',
    'Nature': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    'Heritage': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    'Landmark': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    'Cultural': 'https://images.unsplash.com/photo-1600267175161-cfaa711b4a81?auto=format&fit=crop&w=800&q=80',
  };
  return images[cat] || images['Cultural'];
}

const rawData = [
  { district: 'Chennai', places: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George', 'Santhome Basilica', 'Government Museum'] },
  { district: 'Chengalpattu', places: ['Mahabalipuram', 'Covelong Beach', 'Muttukadu Boat House', 'Vedanthangal Bird Sanctuary'] },
  { district: 'Kanchipuram', places: ['Ekambareswarar Temple', 'Kailasanathar Temple', 'Varadharaja Perumal Temple', 'Silk Saree Weaving Centers'] },
  { district: 'Tiruvallur', places: ['Pulicat Lake', 'Poondi Reservoir', 'Veeraraghava Perumal Temple'] },
  { district: 'Ranipet', places: ['Arcot', 'Ratnagiri Murugan Temple', 'Jalakandeswarar Temple'] },
  { district: 'Vellore', places: ['Vellore Fort', 'Golden Temple Sripuram', 'Amirthi Zoological Park', 'Yelagiri Hills'] },
  { district: 'Tirupathur', places: ['Yelagiri Hills', 'Jalagamparai Falls', 'Nature Park'] },
  { district: 'Tiruvannamalai', places: ['Arunachaleswarar Temple', 'Sathanur Dam', 'Gingee Fort'] },
  { district: 'Villupuram', places: ['Gingee Fort', 'Auroville', 'Mailam Murugan Temple'] },
  { district: 'Kallakurichi', places: ['Kalvarayan Hills', 'Megam Falls', 'Gomuki Dam'] },
  { district: 'Cuddalore', places: ['Pichavaram Mangrove Forest', 'Chidambaram Nataraja Temple', 'Silver Beach'] },
  { district: 'Mayiladuthurai', places: ['Mayuranathaswamy Temple', 'Vaitheeswaran Koil', 'Tharangambadi (Tranquebar)'] },
  { district: 'Nagapattinam', places: ['Velankanni Church', 'Nagore Dargah', 'Kodikkarai Beach'] },
  { district: 'Thanjavur', places: ['Brihadeeswarar Temple', 'Thanjavur Palace', 'Saraswathi Mahal Library'] },
  { district: 'Tiruvarur', places: ['Thyagaraja Temple', 'Muthupet Mangroves', 'Koothanur Saraswathi Temple'] },
  { district: 'Tiruchirappalli', places: ['Rockfort Temple', 'Srirangam Temple', 'Kallanai Dam'] },
  { district: 'Perambalur', places: ['Ranjankudi Fort', 'Viswakudi Dam', 'Siruvachur Temple'] },
  { district: 'Ariyalur', places: ['Gangaikonda Cholapuram', 'Fossil Park', 'Karaivetti Bird Sanctuary'] },
  { district: 'Pudukkottai', places: ['Sittannavasal', 'Thirumayam Fort', 'Kudumiyanmalai Temple'] },
  { district: 'Sivagangai', places: ['Chettinad Palaces', 'Pillayarpatti Temple', 'Karaikudi Heritage Houses'] },
  { district: 'Ramanathapuram', places: ['Rameswaram', 'Pamban Bridge', 'Dhanushkodi'] },
  { district: 'Madurai', places: ['Meenakshi Amman Temple', 'Thirumalai Nayakkar Mahal', 'Alagar Kovil'] },
  { district: 'Dindigul', places: ['Kodaikanal', 'Pillar Rocks', "Coaker's Walk", 'Silver Cascade Falls'] },
  { district: 'Theni', places: ['Meghamalai', 'Suruli Falls', 'Vaigai Dam', 'Kurangani Hills'] },
  { district: 'Virudhunagar', places: ['Srivilliputhur Andal Temple', 'Sathuragiri Hills', 'Ayyanar Falls'] },
  { district: 'Tirunelveli', places: ['Courtallam Falls', 'Nellaiappar Temple', 'Manimuthar Falls'] },
  { district: 'Tenkasi', places: ['Courtallam Main Falls', 'Thenmala', 'Kasi Viswanathar Temple'] },
  { district: 'Thoothukudi', places: ['Thiruchendur Murugan Temple', 'Manapad Beach', 'Kalugumalai'] },
  { district: 'Kanniyakumari', places: ['Vivekananda Rock Memorial', 'Kanyakumari Beach', 'Thiruvalluvar Statue', 'Padmanabhapuram Palace'] },
  { district: 'Coimbatore', places: ['Adiyogi Shiva Statue', 'Marudhamalai Temple', 'Siruvani Waterfalls', 'VOC Park'] },
  { district: 'Tiruppur', places: ['Amaravathi Dam', 'Tiruppur Kumaran Memorial', 'Avinashi Temple'] },
  { district: 'Erode', places: ['Bhavanisagar Dam', 'Kodiveri Dam', 'Thindal Murugan Temple'] },
  { district: 'Salem', places: ['Yercaud', 'Kiliyur Falls', '1008 Lingam Temple'] },
  { district: 'Namakkal', places: ['Namakkal Fort', 'Kolli Hills', 'Agaya Gangai Falls'] },
  { district: 'Dharmapuri', places: ['Hogenakkal Falls', 'Theerthamalai Temple', 'Crocodile Park'] },
  { district: 'Krishnagiri', places: ['Krishnagiri Dam', 'Rayakottai Fort', 'KRP Dam'] },
  { district: 'Nilgiris', places: ['Ooty', 'Doddabetta Peak', 'Botanical Garden', 'Coonoor', 'Nilgiri Mountain Railway'] },
  { district: 'Karur', places: ['Pasupathieswarar Temple', 'Mayanur Dam', 'Nerur Temple'] },
];

const places = [];

for (const { district, places: placeNames } of rawData) {
  for (const name of placeNames) {
    const category = getCategory(name);
    places.push({
      name,
      location: `${district}, Tamil Nadu`,
      district,
      image: getImage(name),
      rating: parseFloat((4.0 + Math.random() * 1).toFixed(1)),
      category,
      description: getDescription(name, district),
      verified: true
    });
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await Place.deleteMany({ location: /Tamil Nadu/i });
    const result = await Place.insertMany(places);
    console.log(`✅ Seeded ${result.length} places across 38 Tamil Nadu districts!`);
    
    // Print category breakdown
    const cats = {};
    places.forEach(p => cats[p.category] = (cats[p.category] || 0) + 1);
    console.log('\nCategory breakdown:');
    Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
