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

const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);

export default Gallery;
