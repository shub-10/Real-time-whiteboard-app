import express, { Request, Response, Router } from "express"
import Slide from '../Models/slide';
import cloudinary from '../config/cloudinary';
import multer from "multer";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
})
const router = express.Router();
export const backendOperations = (): Router => {
  router.post("/slides/:boardId", upload.single("file"), async (req: Request, res: Response) => {
    try {

      if (!req.file) {
        return res.status(400).json({ message: "File required" });
      }
      const boardId = req.params.boardId;
      const { slideno } = req.body;
      // console.log("dataurl: ", dataURL);
      if(!slideno) return res.status(400).json({message: "slide no is required"});
      const result = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `whiteboard/${boardId}`,
            quality: "auto",
            format: "jpg",
            resource_type: "image",
          },
          (error:any, result:any) => {
            if (error) reject(error)
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });
      // console.log(result);
      const slideNo = slideno;
      const slide = await Slide.create({
        boardId,
        slideNo,
        imageUrl: result.secure_url,
        publicId: result.public_id
      });

      console.log("slide id: ", slide._id);

      res.json({ message: "slide saved", slide_id: slide._id });
    } catch (error) {
      console.log("error:", error);
      return res.status(500).json({ message: "error in file uploading" });
    }
  });

  router.get("/:boardId/getPrevSlides", async (req: Request, res: Response) => {
    const boardid = req.params.boardId;
    try {
      const slides = await Slide.find({ boardId: boardid });
      console.log("slides: ", slides);
      return res.status(200).json({ slides });
    } catch (error) {
      console.log("error: ", error);
    }
  });

  router.post("/:boardId/send-invite", async (req: Request, res: Response) => {

    const { toEmail, url } = req.body;
    const roomlink = url;
    const to = toEmail;
    if (!toEmail || !roomlink) return res.status(400).json({ message: "sender mail and invite link is required" });
    console.log("resend api key: ", process.env.RESEND_API_KEY);
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject: "You are invited for a meeting",
      html: `<p> Kaptaan shubham has invited you for a meeting</p>
            <a href="${roomlink}">Join the room </a>
          `
    });
    return res.status(200).json({ message: "invitation sent" });

  })

  return router;
}

