import { prisma } from "../prisma";
import { Role } from "@prisma/client";


// コメント作成
export const createCommentService = async (
  postId: number,
  content: string,
  loginId: string,
  role: Role,
  parentId?: number,
  imageUrl?: string | null   // ⭐ 추가
) => {

  const post = await prisma.post.findUnique({
    where: {
      postId
    }
  });

  if (!post) {
    throw new Error("POST_NOT_FOUND");
  }



  const user = await prisma.user.findUnique({
    where: {
      loginId
    }
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }



  return prisma.comment.create({

    data: {

      content,

      postId,

      userId:user.id,

      parentId: parentId ?? null,

      image: imageUrl ?? null,   // ⭐ 추가

    },

  });

};




// コメント修正
export const updateCommentService = async (
  id:number,
  content:string,
  loginId:string,
  imageUrl?:string | null   // ⭐ 추가
) => {


  const comment =
    await prisma.comment.findUnique({

      where:{
        commentId:id
      },

      include:{
        user:true
      }

    });



  if(!comment){

    throw new Error("COMMENT_NOT_FOUND");

  }



  if(comment.user.loginId !== loginId){

    throw new Error("FORBIDDEN");

  }



  return prisma.comment.update({

    where:{
      commentId:id
    },

    data:{

      content,

      ...(imageUrl !== undefined && {
        image:imageUrl
      })

    }

  });


};




// コメント削除
export const deleteCommentService = async (
  id:number,
  loginId:string,
  role:Role
) => {


  const comment =
    await prisma.comment.findUnique({

      where:{
        commentId:id
      },

      include:{
        user:true
      }

    });



  if(!comment){

    throw new Error("COMMENT_NOT_FOUND");

  }



  const isOwner =
    comment.user.loginId === loginId;


  const isAdmin =
    role === "ADMIN";


  const isModerator =
    role === "MODERATOR";



  if(!isOwner && !isAdmin && !isModerator){

    throw new Error("FORBIDDEN");

  }



  return prisma.comment.update({

    where:{
      commentId:id
    },

    data:{
      isDeleted:true
    }

  });

};