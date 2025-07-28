import { NextApiRequest, NextApiResponse } from 'next';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Account from 'src/models/account';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    const user = await Account.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

   

    return res.status(200).json({
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        tradeUnion: user.tradeUnion,
        source: user.source
      },
    );
  } catch (error) {
    console.error('[Login API Error]:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
