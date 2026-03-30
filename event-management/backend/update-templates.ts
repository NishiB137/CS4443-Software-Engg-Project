import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/event-management');
        const db = mongoose.connection.db;
        if (db) {
            await db.collection('eventtemplates').deleteMany({ isDefault: true });
            console.log('Successfully dropped default templates.');
        } else {
            console.log('Database connection not established.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
