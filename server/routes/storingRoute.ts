import express, {Request, Response, Router} from "express"
import Slide from '../Models/slide';
const router = express.Router();
export const appendInDb = (): Router =>{
  router.post("/slides/:boardId", async(req:Request, res:Response)=>{
      try {
        const {dataURL, slideno} = req.body;
        const boardId = req.params.boardId;
        // console.log("dataurl: ", dataURL);
        if(!dataURL){
          return res.status(400).json({message: "image is required"});
        }
        const [meta, base64] = dataURL.split(',');
        const contentType = meta.match(/data:(.*);base64/)?.[1] || "image/png";
        const buffer = Buffer.from(base64, "base64");

        const slide = await Slide.create({
          boardId,
          slideno,
          image:buffer,
          contentType
        });

        console.log("slide id: ", slide._id);

        res.json({message: "slide saved", slide_id: slide._id});
      } catch (error) {
          console.log(error);
      }
  })

  return router;
}

