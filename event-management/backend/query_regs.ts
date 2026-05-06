import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Registration } from './src/models/Registration.js';
dotenv.config();
mongoose.connect(process.env.MONGO_URI || '').then(async () => {
    console.log(await Registration.find({}).lean());
    process.exit(0);
});
