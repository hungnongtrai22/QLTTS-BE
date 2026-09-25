import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const gallerySchema = new mongoose.Schema(
  {
    internId: {
      type: ObjectId,
      required: true,
      ref: 'intern',
    },
    postedAt: {
      type: Date,
      // required: true,
    },
    title: {
      type: String,
      // required: true,
    },
     description: {
      type: String,
      // required: true,
    },
    imageUrl: [],
    videoUrl: [],
     status: {
      type: String,
      // required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ----------------------------------------------------------------------
// Index. Đây chỉ là cấu trúc tra cứu — KHÔNG thay đổi document nào.
// Trước khi thêm, toàn bộ collection chỉ có index _id mặc định, nên mọi truy vấn
// lọc/sắp xếp đều phải quét hết collection.

// album ảnh của thực tập sinh
gallerySchema.index({ internId: 1 });

const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);

export default Gallery;
