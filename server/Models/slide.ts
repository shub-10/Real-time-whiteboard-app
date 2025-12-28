import mongoose from 'mongoose';

const SlideSchema = new mongoose.Schema({
  boardId: String,
  slideNo: Number,
  imageUrl: String,
  publicId:String,
  createdAt: {type:Date, default: Date.now}
})

export default mongoose.model("Slide", SlideSchema);