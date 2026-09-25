import { NextApiRequest, NextApiResponse } from 'next';
// models
import Account from 'src/models/account';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { requireRole, sendAuthError } from 'src/utils/auth';

// ----------------------------------------------------------------------
// Sửa thông tin tài khoản. Chỉ admin.
// Không đổi mật khẩu ở đây — dùng /api/account/resetPassword.
// ----------------------------------------------------------------------

const ALLOWED_ROLES = ['admin', 'tradeunion', 'source', 'demo', 'dongthap'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const currentAccount = await requireRole(req, ['admin']);

    await db.connectDB();

    const { _id, name, email, role, tradeUnion, companySelect, source, internsDemo } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing account ID (_id)' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}.`,
      });
    }

    const target = await Account.findById(_id);

    if (!target) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    // Không cho admin tự hạ quyền chính mình: đó là cách nhanh nhất để khoá mình ra ngoài.
    if (`${target._id}` === `${currentAccount._id}` && role !== 'admin') {
      return res.status(400).json({
        message: 'You cannot change your own role.',
      });
    }

    // Giữ lại ít nhất một admin trong hệ thống.
    if (target.role === 'admin' && role !== 'admin') {
      const adminCount = await Account.countDocuments({ role: 'admin' });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot remove the last admin account.',
        });
      }
    }

    // Dùng $set/$unset tường minh thay vì gán rồi save():
    // gán `undefined` cho một trường mảng trong Mongoose không chắc chắn xoá được
    // thuộc tính, mà `companySelect` thì buộc phải VẮNG MẶT chứ không phải mảng rỗng.
    const $set: Record<string, unknown> = { name, email, role };
    const $unset: Record<string, ''> = {};

    // Các liên kết chỉ có nghĩa với đúng role của nó.
    if (role === 'tradeunion' && tradeUnion) {
      $set.tradeUnion = tradeUnion;
    } else {
      $unset.tradeUnion = '';
    }

    if (role === 'source' && source) {
      $set.source = source;
    } else {
      $unset.source = '';
    }

    // companySelect: giới hạn xem công ty, CHỈ áp dụng cho role tradeunion.
    // Quy ước dữ liệu: không có thuộc tính = xem toàn bộ công ty của nghiệp đoàn.
    // Vì vậy khi không chọn công ty nào thì phải $unset, tuyệt đối không lưu [].
    if (role === 'tradeunion' && Array.isArray(companySelect) && companySelect.length > 0) {
      $set.companySelect = companySelect;
    } else {
      $unset.companySelect = '';
    }

    if (role === 'demo' && Array.isArray(internsDemo) && internsDemo.length > 0) {
      $set.internsDemo = internsDemo;
    } else if (role !== 'demo') {
      $unset.internsDemo = '';
    }

    const update: Record<string, unknown> = { $set };
    if (Object.keys($unset).length > 0) {
      update.$unset = $unset;
    }

    const updated = await Account.findByIdAndUpdate(_id, update, { new: true }).select('-password');

    return res.status(200).json({
      account: {
        id: updated._id,
        name: updated.name,
        username: updated.username,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (error) {
    if (sendAuthError(error, res)) {
      return undefined;
    }

    console.error('[Account Edit API]: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
