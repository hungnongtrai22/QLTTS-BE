import { verify } from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
// models
import Account from 'src/models/account';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';

// ----------------------------------------------------------------------
// Helper xác thực dùng chung cho mọi API route.
//
// Cách dùng trong handler:
//
//   try {
//     const account = await requireRole(req, ['admin']);
//     ...
//   } catch (error) {
//     if (sendAuthError(error, res)) return;
//     ...
//   }
// ----------------------------------------------------------------------

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

// ----------------------------------------------------------------------
// Chế độ chỉ đọc, bật bằng biến môi trường READ_ONLY=1.
//
// Dùng khi cần thao tác thử trên giao diện mà backend đang trỏ vào CSDL thật:
// server tự từ chối mọi endpoint ghi, nên không phải dựa vào việc "nhớ đừng bấm".
//
// Không chặn theo phương thức HTTP được: codebase này dùng POST cho cả việc đọc
// (user/listBySource, company/listByTradeUnion...). Nên chặn theo tên endpoint,
// bám vào quy ước đặt tên sẵn có.
// ----------------------------------------------------------------------

const READ_ONLY = process.env.READ_ONLY === '1';

const WRITE_PATTERN =
  /\/(create|edit|delete|register|resetPassword|changePassword|importExcel|addHoliday|swapIntern|removeIntern|removeInternFromAll|removeInternPass|removeAttendByInternId|removeContactByInternId|removeStudyByInternId|deleteByTradeUnion|deleteAttendItem|deleteEventItem)|\/update[A-Za-z]*/i;

if (READ_ONLY) {
  console.warn('[READ_ONLY] Bật chế độ chỉ đọc — mọi endpoint ghi sẽ bị từ chối (403).');
}

const isWriteEndpoint = (url?: string) => !!url && WRITE_PATTERN.test(url.split('?')[0]);

/**
 * Nguồn duy nhất của JWT secret cho toàn bộ backend.
 *
 * Không có giá trị dự phòng cố định: thiếu secret thì phải lỗi to và lỗi sớm, chứ không
 * được âm thầm ký token bằng một chuỗi nằm sẵn trong mã nguồn.
 *
 * Cũng không dùng tiền tố NEXT_PUBLIC_: Next.js nhúng mọi biến NEXT_PUBLIC_* vào bundle
 * phía trình duyệt, nên đặt tên như vậy cho secret là một quả mìn chờ nổ.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AuthError(500, 'Server missing JWT_SECRET');
  }

  return secret;
}

/**
 * Đọc bearer token từ header, trả về account tương ứng.
 * Ném AuthError(401) nếu thiếu token, token sai/hết hạn, hoặc account không còn tồn tại.
 */
export async function requireAccount(req: NextApiRequest) {
  // Kiểm tra chế độ chỉ đọc ở đây chứ không phải trong withAuth: nhóm /api/account/*
  // gọi requireRole trực tiếp, không đi qua withAuth. Đặt ở đây thì mọi endpoint
  // yêu cầu đăng nhập đều được bao phủ, không sót nhánh nào.
  if (READ_ONLY && isWriteEndpoint(req.url)) {
    throw new AuthError(403, 'Server đang ở chế độ chỉ đọc (READ_ONLY=1). Thao tác ghi bị từ chối.');
  }

  const secret = getJwtSecret();

  const { authorization } = req.headers;

  if (!authorization) {
    throw new AuthError(401, 'Authorization token missing');
  }

  const accessToken = `${authorization}`.split(' ')[1];

  if (!accessToken) {
    throw new AuthError(401, 'Authorization token missing');
  }

  let decodedToken: any;

  try {
    decodedToken = verify(accessToken, secret);
  } catch (err) {
    throw new AuthError(401, 'Invalid or expired token');
  }

  const userId = decodedToken?.userId;

  if (!userId) {
    throw new AuthError(401, 'Invalid token payload');
  }

  await db.connectDB();

  const account = await Account.findById(userId).select('-password');

  if (!account) {
    throw new AuthError(401, 'Account no longer exists');
  }

  return account;
}

/**
 * Như requireAccount, nhưng bắt buộc account phải thuộc một trong các role cho trước.
 * Ném AuthError(403) nếu đã đăng nhập mà không đủ quyền.
 */
export async function requireRole(req: NextApiRequest, roles: string[]) {
  const account = await requireAccount(req);

  if (!roles.includes(account.role)) {
    throw new AuthError(403, 'Insufficient permissions');
  }

  return account;
}

/**
 * Trả lời client nếu error là AuthError. Trả về true khi đã gửi response,
 * để handler biết dừng lại và không rơi vào nhánh xử lý lỗi chung.
 */
export function sendAuthError(error: unknown, res: NextApiResponse): boolean {
  if (error instanceof AuthError) {
    res.status(error.status).json({ message: error.message });
    return true;
  }

  return false;
}

// ----------------------------------------------------------------------

// Generic theo kiểu request: vài handler dùng next-connect mở rộng NextApiRequest
// (thêm `files` cho upload), nên không thể cố định NextApiRequest ở đây.
type ApiHandler<Req extends NextApiRequest = NextApiRequest> = (
  req: Req,
  res: NextApiResponse
) => unknown | Promise<unknown>;

/**
 * Bọc một API handler để bắt buộc đăng nhập (và tuỳ chọn: đúng role).
 * Chặn ngay trước khi handler chạy, nên handler không cần biết gì về auth.
 *
 *   export default withAuth(handler);                        // chỉ cần đăng nhập
 *   export default withAuth(handler, { roles: ['admin'] });  // phải là admin
 *
 * Account đã xác thực được gắn vào `req.account` cho handler dùng nếu cần.
 */
export function withAuth<Req extends NextApiRequest = NextApiRequest>(
  handler: ApiHandler<Req>,
  options?: { roles?: string[] }
) {
  return async (req: Req, res: NextApiResponse) => {
    // Tự chạy CORS ở đây: nếu từ chối trước khi vào handler mà thiếu header CORS,
    // trình duyệt sẽ báo lỗi CORS thay vì hiện đúng 401.
    await cors(req, res);

    // Preflight không mang Authorization, phải cho qua.
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (READ_ONLY && isWriteEndpoint(req.url)) {
      return res.status(403).json({
        message: 'Server đang ở chế độ chỉ đọc (READ_ONLY=1). Thao tác ghi bị từ chối.',
      });
    }

    try {
      const account = options?.roles
        ? await requireRole(req, options.roles)
        : await requireAccount(req);

      (req as NextApiRequest & { account?: unknown }).account = account;
    } catch (error) {
      if (sendAuthError(error, res)) {
        return undefined;
      }

      console.error('[withAuth]: ', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    return handler(req, res);
  };
}
