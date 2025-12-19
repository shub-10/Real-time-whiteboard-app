import express, {Request, Response, Router} from "express"
import Slide from '../Models/slide';
import cloudinary from '../config/cloudinary';
const router = express.Router();
export const backendOperations = (): Router =>{
  router.post("/slides/:boardId", async(req:Request, res:Response)=>{
      try {
        const {dataURL, slideno} = req.body;
        const boardId = req.params.boardId;
        // console.log("dataurl: ", dataURL);
        if(!dataURL){
          return res.status(400).json({message: "image is required"});
        }
        const result = await cloudinary.uploader.upload(dataURL, {
          folder:`whiteboard/${boardId}`,
          quality: "auto",
          format:"jpg",
          resource_type:"image"
        });
        // console.log(result);
        const slideNo = slideno;
        const slide = await Slide.create({
          boardId,
          slideNo,
          imageUrl:result.secure_url,
          publicId:result.public_id
        });

        console.log("slide id: ", slide._id);

        res.json({message: "slide saved", slide_id: slide._id});
      } catch (error) {
          console.log(error);
      }
  })

  router.get("/:boardId/getPrevSlides", async(req:Request, res:Response)=>{
     const boardid = req.params.boardId;
     const slides = await Slide.find({boardId: boardid});
     console.log("slides: ", slides);
     return res.status(200).json({slides});
  })

  return router;
}

