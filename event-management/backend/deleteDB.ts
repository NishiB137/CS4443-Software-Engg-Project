import mongoose from 'mongoose';

async function deleteDB() {
    await mongoose.connect("mongodb+srv://Samhitha1212:samhitha@cluster0.yn8m78o.mongodb.net/em2?appName=Cluster0");
    await mongoose.connection.dropDatabase();
    console.log("DB deleted");
    process.exit();
}

deleteDB();

