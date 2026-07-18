import sharp from "sharp";
import fs from "fs";
import path from "path";


export const compressCommentImage = async (
  filePath:string
) => {

  const outputDir = path.join(
    process.cwd(),
    "uploads/comments"
  );


  if(!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir,{
      recursive:true
    });
  }


  const fileName =
    `${Date.now()}.webp`;


  const outputPath =
    path.join(
      outputDir,
      fileName
    );


  await sharp(filePath)
    .resize({
      width:800,
      height:800,
      fit:"inside",
      withoutEnlargement:true
    })
    .webp({
      quality:75
    })
    .toFile(outputPath);



  // 임시파일 삭제

  fs.unlinkSync(filePath);



  return `/uploads/comments/${fileName}`;

};