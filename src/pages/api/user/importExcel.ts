/* eslint-disable @typescript-eslint/no-unused-vars, no-plusplus, no-await-in-loop, arrow-body-style, consistent-return */

import { createRouter } from 'next-connect';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';
import ExcelJS from 'exceljs';
import fs from 'fs';
import fileUpload, { UploadedFile } from 'express-fileupload';
import cloudinary from 'cloudinary';
import cors from 'src/utils/cors';
import Intern from 'src/models/intern';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';

interface CustomNextApiRequest extends NextApiRequest {
  files: fileUpload.FileArray;
}

cloudinary.v2.config({
  cloud_name: 'dj4gvts4q',
  api_key: '268454143367214',
  api_secret: 'LSq_5jOOP96udG0PrRjFkFzGD7k',
});

const expressFileUpload = fileUpload({ useTempFiles: true });

const fileUploadMiddleware = (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
  // @ts-ignore
  expressFileUpload(req, res, next);
};

const router = createRouter<CustomNextApiRequest, NextApiResponse>().use(fileUploadMiddleware);

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper tách tên VN / JP
function splitName(raw: string | undefined | null) {
  const safe = (raw ?? '').trim();
  if (!safe) return { name: '', namejp: '' };

  // Tách theo xuống dòng (Windows \r\n hay \n nhiều dòng đều ok)
  const parts = safe
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return { name: '', namejp: '' };
  if (parts.length === 1) {
    // Chỉ có 1 dòng => giả định là tên tiếng Việt, không có namejp
    return { name: parts[0], namejp: '' };
  }

  // Dòng đầu: name (VN), các dòng sau gộp thành namejp
  return { name: parts[0], namejp: parts.slice(1).join(' ') };
}

function convertJapaneseDateToDate(jpDate: string): Date | null {
  if (!jpDate) return null;
  const match = jpDate.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (!match) return null;

  const [_, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

router.post(async (req, res) => {
  try {
    await cors(req, res);
    await db.connectDB();

    const { path } = req.body; // thư mục Cloudinary
    const excelFile = Object.values(req.files || {}).flat()[0] as UploadedFile;

    if (!excelFile) {
      return res.status(400).json({ message: 'Không có file Excel' });
    }

    console.log('📥 Đang đọc file Excel...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFile.tempFilePath);

    const mainSheet = workbook.worksheets[0];
    const data: any[] = [];

    const tradeUnionValue = mainSheet.getCell('C1').value || '';

    // ✅ Đọc dữ liệu từ dòng 8
    mainSheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber < 8) return;
      const rowValues = row.values as Array<string | number | null>;
      if (!rowValues[1]) return;

      const rawName = rowValues[2] as string | undefined;
      const { name, namejp } = splitName(rawName);

      data.push({
        id: rowValues[1] || '',
        name,
        namejp,
        gender: (rowValues[3] as string) || '',
        birth: (rowValues[4] as string) || '',
        company: (rowValues[5] as string) || '',
        work: (rowValues[6] as string) || '',
        interviewDate: (rowValues[7] as string) || '',
        startDate: (rowValues[8] as string) || '',
        endDate: (rowValues[9] as string) || '',
        imageUrl: null,
        tradeUnion: tradeUnionValue, // thêm giá trị tradeUnion
      });
    });

    console.log(`✅ Đã đọc ${data.length} dòng dữ liệu.`);

    const mediaList: any[] = (workbook.model as any).media || [];
    const sheets = workbook.worksheets.slice(1);

    let currentIndex = 0;

    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      const images = sheet.getImages();
      if (images.length > 0) {
        const img = images[0];
        const image = mediaList.find((m) => m.index === img.imageId);

        if (image && image.buffer) {
          console.log(`📤 Upload ảnh cho sheet: ${sheet.name} (${i + 1}/${sheets.length})`);

          const tempImagePath = `./tmp_${img.imageId}.png`;
          fs.writeFileSync(tempImagePath, image.buffer);

          const uploadResult = await uploadToCloudinaryHandler(tempImagePath, path);

          // ✅ Lấy ID từ tên sheet (VD: "1_DƯƠNG TẤN PHÁT")
          let sheetId: number | null = null;
          const match = sheet.name.match(/^(\d+)/);
          if (match) {
            sheetId = parseInt(match[1], 10);
          }

          // ✅ Nếu không có trong tên sheet → lấy từ A1
          if (!sheetId && sheet.getCell('A1').value) {
            const cellValue = sheet.getCell('A1').value?.toString() || '';
            if (/^\d+$/.test(cellValue)) {
              sheetId = parseInt(cellValue, 10);
            }
          }

          // ✅ Gán ảnh cho người đúng ID
          let person = null;
          if (sheetId) {
            person = data.find((p) => Number(p.id) === sheetId);
          }

          // ✅ Fallback theo index nếu vẫn không tìm thấy
          if (!person && data[currentIndex]) {
            person = data[currentIndex];
          }

          if (person) {
            person.imageUrl = uploadResult.url;
            const tradeUnion = await TradeUnion.findOne({ name: person.tradeUnion.trim() });
            const company = await Company.findOne({ name: person.company.trim() });
            // console.log('TradeUnion', person.tradeUnion.trim() === '');
            // console.log('Company', person.company);

            // console.log('TradeUnion', tradeUnion, company);

            const newIntern = await new Intern({
              name: person.name,
              namejp: person.namejp,
              gender: person.gender,
              birthday: convertJapaneseDateToDate(person.birth),
              avatar: person.imageUrl,
              tradeUnion: tradeUnion._id,
              companySelect: company._id,
              interviewDate: person.interviewDate,
              studyDate: person.startDate,
              startDate: person.endDate,
              job: person.work,
            }).save();

            console.log(`📤 Tạo thành công: ${newIntern.name}`);
          } else {
            console.warn(`⚠ Không tìm thấy người cho sheet: ${sheet.name}`);
          }

          currentIndex++;
          fs.unlinkSync(tempImagePath);
        }
      }
    }

    removeTmp(excelFile.tempFilePath);
    console.log('✅ Hoàn tất xử lý!');

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Lỗi xử lý:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Upload ảnh lên Cloudinary
const uploadToCloudinaryHandler = async (filePath: string, folder: string) => {
  return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
    cloudinary.v2.uploader.upload(filePath, { folder }, (err, result) => {
      if (err || !result) {
        return reject(new Error('Upload ảnh thất bại.'));
      }
      resolve({ url: result.secure_url, public_id: result.public_id });
    });
  });
};

// Xóa file tạm
const removeTmp = (path: string) => {
  fs.unlink(path, (error) => {
    if (error) console.error('Xóa file tạm lỗi:', error);
  });
};

const routeHandler = router.handler();

export default withAuth(routeHandler, { roles: ['admin'] });
