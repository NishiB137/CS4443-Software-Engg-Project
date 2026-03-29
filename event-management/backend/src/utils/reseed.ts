import 'dotenv/config';
import mongoose from 'mongoose';
import { EventTemplate } from '../models/EventTemplate.js';
import { seedDefaultTemplates } from './seedTemplates.js';

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventdb'; // default locally
  await mongoose.connect(uri);
  console.log('Clearing default templates...');
  await EventTemplate.deleteMany({ isDefault: true });
  console.log('Re-running seeder...');
  await seedDefaultTemplates();
  console.log('Done!');
  process.exit(0);
}
main().catch(console.error);
