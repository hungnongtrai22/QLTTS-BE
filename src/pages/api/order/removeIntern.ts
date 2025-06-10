import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Order from '../../../models/order';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { orderId, internId } = req.body;

    if (!orderId || !internId) {
      return res
        .status(400)
        .json({ message: `Missing orderId or internId' + ${orderId} + '-' + ${internId}` });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $pull: {
          listIntern: internId, // ✅ Vì đây là mảng ObjectId
          // hoặc: listIntern: internId  // nếu là mảng các ID
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Remove Intern from Order API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
