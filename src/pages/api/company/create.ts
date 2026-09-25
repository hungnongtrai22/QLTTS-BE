import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Company from 'src/models/company';
// _mock
import { withAuth } from 'src/utils/auth';
import { CompanyFieldError, pickCompanyContractFields } from 'src/utils/contract-fields';
import db from '../../../utils/db';
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const { name, } = req.body;
    // Chỉ lấy phần $set: tài liệu mới chưa có gì để $unset.
    const { $set: contractFields } = pickCompanyContractFields(req.body || {});
    const newCompany = await new Company({
      name,
      email: req?.body?.email || "",
      address: req?.body?.address || "",
      city: req?.body?.city || "",
      state: req?.body?.state || "",
      country: req?.body?.country || "",
      phone: req?.body?.phone || "",
      tradeUnion: req?.body?.tradeUnion || "",
      descriptions: req?.body?.descriptions || "",
      ...contractFields,
    }).save();

    return res.status(200).json({
      company: newCompany,
    });
  } catch (error) {
    if (error instanceof CompanyFieldError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('[Auth API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export default withAuth(handler, { roles: ['admin'] });
