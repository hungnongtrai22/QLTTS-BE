import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import Account from 'src/models/account';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { requireRole, sendAuthError } from 'src/utils/auth';

// ----------------------------------------------------------------------
// Tạo tài khoản. Đây KHÔNG phải endpoint đăng ký công khai:
// chỉ admin đã đăng nhập mới gọi được, và role phải nằm trong danh sách cho phép.
// ----------------------------------------------------------------------

const ALLOWED_ROLES = ['admin', 'tradeunion', 'source', 'demo', 'dongthap'];

const MIN_PASSWORD_LENGTH = 8;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    // Chặn ở đây trước khi đọc bất cứ thứ gì từ body.
    await requireRole(req, ['admin']);

    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    if (`${password}`.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    // Role đến từ client nên không được tin: chỉ nhận giá trị nằm trong danh sách.
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}.`,
      });
    }

    const existingUser = await Account.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: 'There already exists an account with the given username.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { tradeUnion, source, companySelect, internsDemo } = req.body;

    const payload: Record<string, unknown> = {
      name,
      username,
      password: hashedPassword,
      email: req?.body?.email,
      role,
    };

    // Chỉ gắn liên kết đúng với role, và chỉ khi có giá trị — không tạo trường rỗng.
    if (role === 'tradeunion' && tradeUnion) {
      payload.tradeUnion = tradeUnion;
    }

    if (role === 'source' && source) {
      payload.source = source;
    }

    // companySelect vắng mặt = tài khoản xem được toàn bộ công ty của nghiệp đoàn.
    // Chỉ ghi khi thực sự có giới hạn, không bao giờ ghi mảng rỗng.
    if (role === 'tradeunion' && Array.isArray(companySelect) && companySelect.length > 0) {
      payload.companySelect = companySelect;
    }

    if (role === 'demo' && Array.isArray(internsDemo) && internsDemo.length > 0) {
      payload.internsDemo = internsDemo;
    }

    const newUser = await Account.create(payload);

    // Mongoose tự sinh mảng rỗng cho trường kiểu mảng kể cả khi payload không có.
    // Quy ước dữ liệu ở đây là thuộc tính phải VẮNG MẶT, nên xoá lại cho đúng.
    // (Sửa schema thêm `default: undefined` sẽ gọn hơn, nhưng đó là thay đổi model.)
    const unsetEmpty: Record<string, ''> = {};
    if (!payload.companySelect) unsetEmpty.companySelect = '';
    if (!payload.internsDemo) unsetEmpty.internsDemo = '';

    if (Object.keys(unsetEmpty).length > 0) {
      await Account.updateOne({ _id: newUser._id }, { $unset: unsetEmpty });
    }

    // Không phát accessToken ở đây. Admin đang tạo tài khoản cho người khác,
    // không phải tự đăng nhập — người dùng mới sẽ tự đăng nhập bằng mật khẩu được cấp.
    return res.status(201).json({
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (sendAuthError(error, res)) {
      return undefined;
    }

    console.error('[Register API Error]:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
