import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

// ログファイルが保存されるディレクトリのパスです。現在の作業ディレクトリの「logs」フォルダです。
const LOG_DIR = path.join(process.cwd(), "logs"); 
// 秘匿が必要なキーのリストです。これらのキーに該当する値はログ上で「[REDACTED]」に置き換えられます。
const SENSITIVE_KEYS = new Set([
  "password",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
]);
// 現在のログファイル名と書き込みストリームを管理する変数です。毎日新しいログファイルが生成されるたびに更新されます。
let currentLogFile = "";
let currentStream: fs.WriteStream | null = null;

// ログディレクトリが存在しない場合に作成する関数です。
const ensureLogDir = () => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
};

// 現在の日付に対応するログファイルの書き込みストリームを返す関数です。ログファイルが変更されると、既存のストリームを閉じて新しいストリームを生成します。
const getLogStream = () => {
  ensureLogDir();
  // ログファイル名は「YYYY-MM-DD.http.jsonl」形式です。
  const fileName = `${new Date().toISOString().slice(0, 10)}.http.jsonl`;
  // 現在のログファイルが変更された場合、既存のストリームを閉じて新しいストリームを作成します。
  if (!currentStream || currentLogFile !== fileName) {
    currentStream?.end();
    currentLogFile = fileName;
    currentStream = fs.createWriteStream(path.join(LOG_DIR, fileName), {
      flags: "a",
    });
  }
  // 現在のログファイルの書き込みストリームを返します。
  return currentStream;
};

// ログから機密情報を除去する関数です。オブジェクト、配列、バッファなど様々なデータ構造を再帰的に処理します。
const redact = (value: unknown): unknown => {
  // null または undefined の場合はそのまま返します。
  if (value == null) return value;
  // バッファの場合はサイズ情報を含む文字列として返します。
  if (Buffer.isBuffer(value)) {
    return `[Buffer ${value.length} bytes]`;
  }
  // 配列の場合は各要素を再帰的に処理して新しい配列を返します。
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  // オブジェクトの場合は各キー・値のペアを処理して新しいオブジェクトを返します。機密キーに該当する値は「[REDACTED]」に置き換えられます。
  if (typeof value === "object") {
    // 結果を保存するオブジェクトです。
    const result: Record<string, unknown> = {};
    // オブジェクトの各キー・値のペアをループして処理します。
    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (SENSITIVE_KEYS.has(key)) { // 機密キーの場合
        result[key] = "[REDACTED]";
      } else {
        result[key] = redact(nestedValue);
      }
    }
    // 処理済みのオブジェクトを返します。
    return result;
  }

  return value;
};

// HTTPリクエストとレスポンスをログファイルに記録するミドルウェア関数です。リクエスト処理後にログを記録し、機密情報は除去されます。
export const httpLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // リクエスト開始時間を記録します。
  const startedAt = Date.now();
  let responseBody: unknown; // レスポンスボディを保存する変数です。

  // res.json と res.send メソッドをオーバーライドしてレスポンスボディをキャプチャします。元のメソッドを呼び出して正常にレスポンスが送信されるようにします。
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    responseBody = body;
    return originalJson(body);
  }) as Response["json"];

  // res.send もオーバーライドしてレスポンスボディをキャプチャします。
  const originalSend = res.send.bind(res);
  res.send = ((body: unknown) => {
    responseBody = body;
    return originalSend(body);
  }) as Response["send"];

  // レスポンス完了後にログを記録するイベントリスナーです。リクエストとレスポンスの情報を含むログレコードを生成し、ファイルに書き込みます。
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const hasAuthHeader = !!req.headers.authorization;
    const hasRefreshCookie = !!req.cookies?.refreshToken;

    // コンソールにもログを出力します。HTTPメソッド、URL、ステータスコード、処理時間、認証情報の有無が含まれます。
    console.log(
      `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms auth=${hasAuthHeader ? "Y" : "N"} refresh=${hasRefreshCookie ? "Y" : "N"}`
    );

    // ログレコードを生成します。タイムスタンプ、メソッド、URL、ステータスコード、処理時間、IP、Origin、リクエスト/レスポンス内容（機密情報除去済み）が含まれます。
    const record = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      origin: req.headers.origin ?? null,
      request: {
        query: redact(req.query),
        body: redact(req.body),
        authHeader: hasAuthHeader ? "[PRESENT]" : null,
        refreshCookie: hasRefreshCookie ? "[PRESENT]" : null,
      },
      response: redact(responseBody),
    };

    getLogStream().write(`${JSON.stringify(record)}\n`);
  });
  
  // 次のミドルウェアへ移動します。
  next();
};