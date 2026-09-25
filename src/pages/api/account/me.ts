import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import { requireAccount, sendAuthError } from 'src/utils/auth';

// ----------------------------------------------------------------------
// Trả về tài khoản ứng với token đang gửi lên.
//
// Endpoint này KHÔNG bọc withAuth vì bản thân nó chính là bước tự xác thực:
// FE gọi nó lúc khởi động để khôi phục phiên đăng nhập từ token trong localStorage.
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    await cors(req, res);

    if (req.method !== 'GET') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    // requireAccount tự xác thực token, tự kết nối DB và loại bỏ trường password.
    const user = await requireAccount(req);

    res.status(200).json({ user });
  } catch (error) {
    if (sendAuthError(error, res)) {
      return;
    }

    console.error('[Me API Error]:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
