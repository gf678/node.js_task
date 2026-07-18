import { Request, Response } from "express";
import {
  createCommentService,
  updateCommentService,
  deleteCommentService
} from "../services/comment.service";

import { prisma } from "../prisma";
import { compressCommentImage } from "../services/image.service";


/**
 * コメント作成
 */
export const createComment = async (
  req: Request,
  res: Response
) => {

  try {

    const { postId } = req.params;
    const { content, parentId } = req.body;

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message:"UNAUTHORIZED"
      });
    }


    let imageUrl = null;


    // 이미지 업로드 처리
    if(req.file){

      imageUrl =
        await compressCommentImage(
          req.file.path
        );

    }


    const result =
      await createCommentService(
        Number(postId),
        content,
        user.loginId,
        user.role,
        parentId
          ? Number(parentId)
          : undefined,
        imageUrl   // ⭐ 추가
      );


    return res.json(result);


  } catch(err){

    console.error(err);

    return res.status(500).json({
      message:"SERVER_ERROR"
    });

  }

};




/**
 * コメント修正
 */
export const updateComment = async (
  req: Request,
  res: Response
) => {

  try {

    const { id } = req.params;
    const { content } = req.body;

    const user = req.user;


    if(!user){
      return res.status(401).json({
        message:"UNAUTHORIZED"
      });
    }


    let imageUrl = null;


    if(req.file){

      imageUrl =
        await compressCommentImage(
          req.file.path
        );

    }



    const result =
      await updateCommentService(
        Number(id),
        content,
        user.loginId,
        imageUrl
      );


    return res.json(result);


  }catch(err){

    console.error(err);

    return res.status(500).json({
      message:"SERVER_ERROR"
    });

  }

};




/**
 * コメント削除
 */
export const deleteComment = async (
  req: Request,
  res: Response
) => {


  const commentId =
    Number(req.params.id);


  const userId =
    req.user?.id;



  if(!userId){

    return res.status(401).json({
      message:"UNAUTHORIZED"
    });

  }



  if(!Number.isInteger(commentId)){

    return res.status(400).json({
      message:"INVALID_COMMENT_ID",
      params:req.params,
    });

  }



  const comment =
    await prisma.comment.findUnique({

      where:{
        commentId,
      },

    });



  if(!comment){

    return res.status(404).json({
      message:"COMMENT_NOT_FOUND"
    });

  }



  if(comment.userId !== userId){

    return res.status(403).json({
      message:"FORBIDDEN"
    });

  }



  await prisma.comment.update({

    where:{
      commentId,
    },

    data:{

      isDeleted:true,

      content:"削除されたコメントです。",

    },

  });



  return res.json({
    message:"COMMENT_SOFT_DELETED"
  });


};