// 投稿の作成者情報とログイン中のユーザー情報をマージするユーティリティ関数

type UserLike = { // ユーザーID、ログインID、ニックネーム、プロフィール画像URLを含む型の定義
  id?: number;
  loginId?: string;
  alias?: string;
  profileImg?: string | null;
};

// 投稿の作成者情報とログイン中のユーザー情報をマージする関数です。
// 両方のオブジェクトが同一ユーザーである場合、ログインユーザーのニックネームとプロフィール画像を優先して上書きします。
export const mergeCurrentUser = <T extends UserLike>(
  // 作成者情報とログインユーザー情報の両方が存在する場合のみマージを実行。
  // どちらか一方が欠けている場合は、元の作成者情報をそのまま返します。
  user: T | null | undefined,
  currentUser: UserLike | null | undefined
): T | null | undefined => {
  if (!user || !currentUser) return user;
  
  // 作成者情報とログインユーザー情報が同一人物を指しているか確認します。
  // IDまたはログインIDが一致する場合、同一ユーザーと見なします。
  const sameUser =
    (user.id !== undefined &&
      currentUser.id !== undefined &&
      user.id === currentUser.id) ||
    (!!user.loginId &&
      !!currentUser.loginId &&
      user.loginId === currentUser.loginId);

  // 同一ユーザーでない場合は、元の作成者情報をそのまま返します。
  if (!sameUser) return user;
  
  // 同一ユーザーである場合、ログインユーザーの最新のニックネームとプロフィール画像を作成者情報に反映させます。
  return {
    ...user,
    alias: currentUser.alias ?? user.alias,
    profileImg: currentUser.profileImg ?? user.profileImg,
  };
};