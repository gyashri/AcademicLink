import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

import { University } from './models/University';

const seedUniversities = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const universities = [
    { name: 'MIT', domain: 'mit.edu', departments: ['Engineering', 'Computer Science', 'Mathematics'] },
    { name: 'Harvard University', domain: 'harvard.edu', departments: ['Law', 'Business', 'Medicine'] },
    { name: 'Stanford University', domain: 'stanford.edu', departments: ['Engineering', 'Business', 'Medicine'] },
    { name: 'University of Mumbai', domain: 'mu.ac.in', departments: ['Engineering', 'Science', 'Arts'] },
    { name: 'Delhi University', domain: 'du.ac.in', departments: ['Science', 'Commerce', 'Arts'] },
    { name: 'IIT Bombay', domain: 'iitb.ac.in', departments: ['Computer Science', 'Electrical', 'Mechanical'] },
    { name: 'IIT Delhi', domain: 'iitd.ac.in', departments: ['Computer Science', 'Electrical', 'Mechanical'] },
    { name: 'IIT Madras', domain: 'iitm.ac.in', departments: ['Computer Science', 'Electrical', 'Civil'] },
    { name: 'VIT', domain: 'vit.ac.in', departments: ['Engineering', 'Science', 'Management'] },
    { name: 'SRM University', domain: 'srmist.edu.in', departments: ['Engineering', 'Science', 'Management'] },
    { name: 'NIT Jamshedpur', domain: 'nitjsr.ac.in', departments: ['Engineering', 'Science', 'Management', 'Computer Science'] },
  ];

  for (const u of universities) {
    const existing = await University.findOne({ domain: u.domain });
    if (!existing) {
      await University.create(u);
      console.log(`Added: ${u.name} (${u.domain})`);
    } else {
      console.log(`Skipped (exists): ${u.name} (${u.domain})`);
    }
  }

  console.log('Seeding complete!');
  await mongoose.disconnect();
};

seedUniversities().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
