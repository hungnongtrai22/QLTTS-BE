import { NextApiRequest, NextApiResponse } from 'next';
import Order from 'src/models/order';
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';

// ----------------------------------------------------------------------
// Đánh dấu TTS đậu một đơn hàng (thêm vào order.listInternPass).
//
// Một TTS có thể đậu nhiều đơn: danh sách đậu nằm trên từng đơn, không đụng tới hồ sơ TTS.
// Chỉ nhận TTS đang là ứng viên của đơn (có trong listIntern).
//
// Ghi bằng $addToSet thay vì gán mảng rồi order.save(): save() kiểm lại MỌI trường bắt buộc
// của đơn, đơn tạo từ trước khi thêm trường mới sẽ không lưu được.
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { _id, listInternPass: incomingIds } = req.body || {};

    if (!_id || !Array.isArray(incomingIds) || incomingIds.length === 0) {
      return res.status(400).json({ message: 'Missing or invalid order ID or listInternPass' });
    }

    await db.connectDB();

    const order: any = await Order.findById(_id).select('listIntern').lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const candidates = new Set((order.listIntern || []).map((id: any) => id.toString()));
    const ids = Array.from(new Set(incomingIds.map(String))).filter((id) => candidates.has(id));

    if (ids.length === 0) {
      return res.status(400).json({ message: 'Intern is not a candidate of this order' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      _id,
      { $addToSet: { listInternPass: { $each: ids } } },
      { new: true }
    )
      .select('listInternPass')
      .lean();

    return res.status(200).json({ order: updatedOrder });
  } catch (error) {
    console.error('[Update Intern Pass API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: trang Đơn hàng chỉ admin vào được (RoleBasedGuard + menu).
export default withAuth(handler, { roles: ['admin'] });
