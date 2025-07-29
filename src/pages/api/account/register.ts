import { NextApiRequest, NextApiResponse } from 'next';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Account from 'src/models/account';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = '7d'; // ví dụ: 7 ngày

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    const existingUser = await Account.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: 'There already exists an account with the given username.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Account.create({
      name,
      username,
      password: hashedPassword,
      email: req?.body?.email,
      role: req?.body?.role,
      tradeUnion: req?.body?.tradeUnion,
      source: req?.body?.source,
    });

    const accessToken = sign({ userId: newUser._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(201).json({
      accessToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('[Register API Error]:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
