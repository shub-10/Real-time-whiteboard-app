import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const connectDB = async ()=>{
  try {

    const connectionString = process.env.MONGODB_URL
    if(!connectionString) return;
    await mongoose.connect(connectionString);
    console.log("db connection is successfull");
  } catch (error) {
    console.log(error);
  }
}

export default connectDB;