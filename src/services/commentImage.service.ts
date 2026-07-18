import sharp from "sharp";
import fs from "fs";
import path from "path";


export const compressCommentImage = async (
  file: Express.Multer.File
) => {

  const uploadDir = path.resolve(
    "uploads/comments"
  );


  if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{
      recursive:true
    });
  }


  const filename =
    `${Date.now()}.webp`;


  const filepath =
    path.join(
      uploadDir,
      filename
    );


  await sharp(file.path)
    .resize({
      width:800,
      height:800,
      fit:"inside",
      withoutEnlargement:true
    })
    .webp({
      quality:80
    })
    .toFile(filepath);


  fs.unlinkSync(file.path);


  return `/uploads/comments/${filename}`;
};