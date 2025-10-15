import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import db from '../../../utils/db';
import Intern from '../../../models/intern';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    // Lấy _id và object certificate cần thêm từ body
    const { _id, certificate } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing intern ID (_id)' });
    }
    // ✅ Kiểm tra certificate có phải là một object (và không phải array)
    if (!certificate || typeof certificate !== 'object' || Array.isArray(certificate)) {
      return res.status(400).json({ message: 'Certificate data must be a single object' });
    }

    // ✅ Dùng $push để thêm một object vào mảng 'certificate'
    const updatedIntern = await Intern.findByIdAndUpdate(
      _id,
      {
        $push: { certificate: certificate } // Bỏ $each vì chỉ thêm một object
      },
      { new: true } // Trả về document sau khi đã cập nhật
    );

    if (!updatedIntern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    return res.status(200).json({
      intern: updatedIntern,
    });
  } catch (error) {
    console.error('[Update Intern API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}