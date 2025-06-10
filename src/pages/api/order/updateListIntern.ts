import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Order from 'src/models/order';
import db from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id, listIntern: incomingIds } = req.body;

    if (!_id || !Array.isArray(incomingIds)) {
      return res.status(400).json({ message: 'Missing or invalid order ID or listIntern' });
    }

    const order = await Order.findById(_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const existingIds = new Set((order.listIntern || []).map((id: any) => id.toString()));

    // Loại bỏ ID trùng lặp
    const newUniqueIds = Array.from(new Set(incomingIds))
      .filter((id) => !existingIds.has(id));

    // Gộp lại danh sách
    order.listIntern = [...order.listIntern, ...newUniqueIds];

    const updatedOrder = await order.save();

    return res.status(200).json({ order: updatedOrder });
  } catch (error) {
    console.error('[Update Intern API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
