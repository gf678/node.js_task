import { Request, Response, NextFunction } from "express";

// 訪問者追跡ミドルウェアです。各リクエストのIPアドレスに基づいて訪問者統計を収集し、総訪問者数とユニークユーザー数を管理します。また、IPアドレスごとの訪問回数を記録し、統計情報を提供します。visitorStatsHandlerは現在の訪問者統計をJSON形式で返すハンドラーです。
const visitsByIp = new Map<string, number>();
let totalVisits = 0;

// IPアドレスを正規化する関数です。
const normalizeIp = (ip?: string | null) => {
  if (!ip) return "unknown";
  return ip.replace("::ffff:", "");
};

// クライアントのIPアドレスを抽出する関数です。X-Forwarded-Forヘッダーを優先的に確認し、該当するヘッダーがない場合はソケットのリモートアドレスを使用します。抽出されたIPアドレスはnormalizeIp関数を通じて正規化されます。
const getClientIp = (req: Request) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return normalizeIp(forwarded.split(",")[0].trim());
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return normalizeIp(forwarded[0]);
  }

  return normalizeIp(req.socket.remoteAddress);
};

// 訪問者追跡ミドルウェアです。各リクエストからクライアントのIPアドレスを抽出し、総訪問者数とユニークユーザー数を更新します。また、IPアドレスごとの訪問回数を記録します。ログにはリクエストメソッド、URL、IPアドレス、総訪問者数、ユニークユーザー数、該当IPの訪問回数が含まれます。
export const visitorTracker = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // クライアントのIPアドレスを抽出します。
  const ip = getClientIp(req);

  totalVisits += 1;
  // IPアドレス別の訪問回数を更新します。該当IPアドレスの現在の訪問回数を取得して1を加算した後、Mapに保存します。
  const ipVisitCount = (visitsByIp.get(ip) ?? 0) + 1;
  visitsByIp.set(ip, ipVisitCount);
  // 訪問者統計情報をres.locals.visitorStatsに保存し、以降のミドルウェアやハンドラーで使用できるようにします。統計情報にはIPアドレス、総訪問者数、ユニークユーザー数、該当IPの訪問回数が含まれます。
  res.locals.visitorStats = {
    ip,
    totalVisits,
    uniqueVisitorCount: visitsByIp.size,
    ipVisitCount,
  };

  console.log( // 訪問者統計情報をログに出力します。ログにはメソッド、URL、IPアドレス、合計数、ユニーク数、個人カウントが含まれます。
    `[VISITOR] ${req.method} ${req.originalUrl} ip=${ip} total=${totalVisits} unique=${visitsByIp.size} myCount=${ipVisitCount}`
  );

  next();
};

// 訪問者統計情報を返すハンドラーです。クライアントのIPアドレス、総訪問者数、ユニークユーザー数、各IPアドレス別の訪問回数を含む統計情報をJSON形式で返します。各IPアドレス別の訪問回数は、訪問回数が多い順にソートされて返されます。
export const visitorStatsHandler = (req: Request, res: Response) => {
  const ip = getClientIp(req);
  // 訪問者統計情報をJSON形式で返却します。返却される情報には、クライアントのIP、総訪問数、ユニークユーザー数、各IPごとの訪問回数が含まれます。各IP別の訪問回数は、訪問数の多い順にソートされます。
  res.json({
    yourIp: ip,
    yourVisitCount: visitsByIp.get(ip) ?? 0,
    totalVisits,
    uniqueVisitorCount: visitsByIp.size,
    visitors: Array.from(visitsByIp.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([visitorIp, count]) => ({
        ip: visitorIp,
        count,
      })),
  });
};