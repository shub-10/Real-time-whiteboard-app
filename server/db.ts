import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const connectDB = async ()=>{
  try {
    if(!process.env.MONGODB_URL) return;
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database connected...");
  } catch (error) {
    console.error("problem in db connection: ", error);
    process.exit(1);
  }
}

export default connectDB;