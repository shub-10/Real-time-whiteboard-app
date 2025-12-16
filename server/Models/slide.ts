import mongoose from 'mongoose';

const SlideSchema = new mongoose.Schema({
  boardId: String,
  slideno: Number,
  image: Buffer,
  contentType: String,
  createdAt: {type:Date, default: Date.now}
})

export default mongoose.model("Slide", SlideSchema);