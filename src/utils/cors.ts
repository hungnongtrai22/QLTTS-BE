import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';

// ----------------------------------------------------------------------

type Middleware = (req: NextApiRequest, res: NextApiResponse, next: (result: any) => void) => void;

const initMiddleware = (middleware: Middleware) => (req: NextApiRequest, res: NextApiResponse) =>
  new Promise<void>((resolve, reject) => {
    middleware(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve();
    });
  });

// ----------------------------------------------------------------------
// Danh sách origin được phép, đọc từ biến môi trường CORS_ORIGINS,
// phân tách bằng dấu phẩy. Ví dụ:
//
//   CORS_ORIGINS = https://abc.amplifyapp.com,http://localhost:3000
//
// Chưa cấu hình thì cho qua tất cả, giữ nguyên hành vi cũ — để việc quên set biến
// không làm sập production. Đổi lại, chừng nào chưa set thì chưa siết được CORS,
// nên có cảnh báo mỗi lần khởi động.
// ----------------------------------------------------------------------

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (ALLOWED_ORIGINS.length === 0) {
  console.warn(
    '[CORS] CORS_ORIGINS chưa được cấu hình — đang cho phép mọi origin. ' +
      'Đặt biến này để chỉ cho phép domain của hệ thống.'
  );
}

const isAllowedOrigin = (origin?: string) => {
  // Không có header Origin nghĩa là không phải request từ trình duyệt
  // (curl, gọi server-to-server, health check). CORS không áp dụng cho những
  // request này; chúng vẫn phải qua lớp xác thực trong withAuth.
  if (!origin) return true;

  if (ALLOWED_ORIGINS.length === 0) return true;

  return ALLOWED_ORIGINS.includes(origin);
};

// Tuỳ chọn đầy đủ: https://github.com/expressjs/cors#configuration-options
const cors = initMiddleware(
  Cors({
    origin(origin, callback) {
      // Trả về false thay vì Error: chỉ bỏ header Access-Control-Allow-Origin để
      // trình duyệt tự chặn. Ném Error sẽ khiến handler trả 500 kèm stack trace,
      // vừa khó hiểu cho client vừa lộ thông tin không cần thiết.
      callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

export default cors;
