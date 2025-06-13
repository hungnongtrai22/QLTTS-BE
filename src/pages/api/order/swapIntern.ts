// /pages/api/order/swap-intern-to-index.ts

import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Order from 'src/models/order';
import db from 'src/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id, internId, newIndex } = req.body;

    if (!_id || !internId || typeof newIndex !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid parameters' });
    }

    const order = await Order.findById(_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const list = (order.listIntern || []).map((id: any) => id.toString());
    const currentIndex = list.indexOf(internId);

    if (currentIndex === -1) {
      return res.status(404).json({ message: 'Intern not found in list' });
    }

    if (newIndex < 0 || newIndex >= list.length) {
      return res.status(400).json({ message: 'Invalid newIndex' });
    }

    // Swap only if different
    if (currentIndex !== newIndex) {
      const targetInternId = list[newIndex];
      list[newIndex] = internId;
      list[currentIndex] = targetInternId;
    }

    order.listIntern = list;
    const updatedOrder = await order.save();

    return res.status(200).json({ order: updatedOrder });
  } catch (error) {
    console.error('[Swap Intern to Index API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
