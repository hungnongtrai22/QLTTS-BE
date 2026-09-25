import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const internSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    namejp: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    blood: {
      type: String,
      // required: true,
    },
    birthday: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      // required: true,
    },
    height: {
      type: Number,
      // required: true,
    },
    weight: {
      type: Number,
      // required: true,
    },
    BMI: {
      type: Number,
      // required: true,
    },
    blindColor: {
      type: Boolean,
      // required: true,
    },
    leftEye: {
      type: String,
      // required: true,
    },
    rightEye: {
      type: String,
      // required: true,
    },
    hand: {
      type: String,
      // required: true,
    },
    married: {
      type: String,
      // required: true,
    },
    driverLicense: {
      type: String,
      // required: true,
    },
    smoke: {
      type: Boolean,
      default: false,
    },
    alcohol: {
      type: Boolean,
      default: false,
    },
    tattoo: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      // required: true,
    },
    city: {
      type: String,
      // required: true,
    },
    school: [
      {
        timeFrom: {
          type: Date,
          // required: true,
        },
        timeTo: {
          type: Date,
          // required: true,
        },
        name: {
          type: String,
          // required: true,
        },
        content: {
          type: String,
          // required: true,
        },
        current: {
          type: String,
          // required: true,
        },
      },
    ],
    avatar: {
      type: String,
      required: true,
    },
    company: [
      {
        timeFrom: {
          type: Date,
          // required: true,
        },
        timeTo: {
          type: Date,
          // required: true,
        },
        name: {
          type: String,
          // required: true,
        },
        content: {
          type: String,
          // required: true,
        },
        address: {
          type: String,
        },
      },
    ],
    family: [
      {
        relationship: {
          type: String,
          // required: true,
        },
        name: {
          type: String,
          // required: true,
        },
        year: {
          type: Date,
          // required: true,
        },
        location: {
          type: String,
          // required: true,
        },
        occupation: {
          type: String,
          // required: true,
        },
      },
    ],
    interest: {
      type: String,
      // required: true,
    },
    foreignLanguage: {
      type: String,
      // required: true,
    },
    strong: [],
    weak: [],
    aim: {
      type: String,
      // required: true,
    },
    plan: {
      type: String,
      // required: true,
    },
    money: {
      type: String,
      // required: true,
    },
    familyInJapan: {
      type: Boolean,
      // required: true,
    },
    moveForeign: {
      type: Boolean,
      // required: true,
    },
    tradeUnion: {
      type: ObjectId,
      ref: 'TradeUnion',
    },
    source: {
      type: ObjectId,
      ref: 'source',
    },
    companySelect: {
      type: ObjectId,
      ref: 'company',
    },
    iq: {
      type: Number,
    },
    math: {
      type: Number,
    },
    kraepelin1: {
      type: Number,
    },
    kraepelin2: {
      type: Number,
    },
    status: {
      type: String,
      default: 'interview',
    },
    job: {
      type: String,
    },
    interviewDate: {
      type: Date,
    },
    studyDate: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    departureDate: {
      type: Date,
    },
    returnDate: {
      type: Date,
    },
    type: {
      type: String,
      default: 'intern',
    },
    certificate: [],
    pushup: {
      type: Number,
    },
    field: {
      type: String,
    },
    citizenId: {
      type: String,
    },
    citizenDate: {
      type: Date,
    },
    citizenPlace: {
      type: String,
    },
    passportId: {
      type: String,
    },
    passportDate: {
      type: Date,
    },
    reff: {
      type: String,
    },
    street: {
      type: String,
    },
    state: {
      type: String,
    },
    // city: {
    //   type: String,
    // },
    postelCode: {
      type: String,
    },
    country: {
      type: String,
    },
    phone: {
      type: String,
    },
    contractId: {
      type: String,
    },
    contractDate: {
      type: Date,
    },

    contractPeriod: {
      type: String,
    },
    contractResult: {
      type: String,
    },
    // departureDate: {
    //   type: Date,
    // },
    profileStatus: {
      type: String,
    },
    orderId: {
      type: ObjectId,
      ref: 'order',
    },
    description: {
      type: String,
    },
    birthPlace: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    children: {
      type: String,
    },
    respiratoryDisease: {
      type: Boolean,
    },
    obstetrics: {
      type: Boolean,
    },
    highBloodPressure: {
      type: Boolean,
    },
    ophthalmological: {
      type: Boolean,
    },
    urinaryDiseases: {
      type: Boolean,
    },
    anemia: {
      type: Boolean,
    },
    otorhinolaryngological: {
      type: Boolean,
    },
    cranialNerves: {
      type: Boolean,
    },
    headache: {
      type: Boolean,
    },
    pharyngealSystemDisease: {
      type: Boolean,
    },
    hernia: {
      type: Boolean,
    },
    anyAllergies: {
      type: Boolean,
    },
    cardiovascularDisease: {
      type: Boolean,
    },
    rheumatism: {
      type: Boolean,
    },
    irregalerMenstruation: {
      type: Boolean,
    },
    heartDisease: {
      type: Boolean,
    },
    fainting: {
      type: Boolean,
    },
    tbTest: {
      type: Boolean,
    },
    dental: {
      type: Boolean,
    },
    diabetes: {
      type: Boolean,
    },
    history: {
      type: Boolean,
    },
    digestive: {
      type: Boolean,
    },
    asthma: {
      type: Boolean,
    },
    otherMajor: {
      type: Boolean,
    },
    psychosomatic: {
      type: Boolean,
    },
    vnsomnia: {
      type: Boolean,
    },
    surgery: {
      type: Boolean,
    },
    hematology: {
      type: Boolean,
    },
    lowerBack: {
      type: Boolean,
    },
    hospitalization: {
      type: Boolean,
    },
    others: {
      type: String,
    },
    moneyMonthFrom: {
      type: String,
    },
    moneyMonthTo: {
      type: String,
    },
    money3YearsFrom: {
      type: String,
    },
    money3YearsTo: {
      type: String,
    },
    religion: {
      type: String,
    },
    planMarried: {
      type: String,
    },
    crime: {
      type: Boolean,
    },
    crimeDetail: {
      type: String,
    },
    fillInfo: {
      type: String,
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

// sắp xếp mặc định của bảng danh sách
internSchema.index({ createdAt: -1 });
// tab trạng thái + sắp xếp; cũng phục vụ đếm theo status
internSchema.index({ status: 1, createdAt: -1 });
// lọc theo nghiệp đoàn, listByTradeUnion
internSchema.index({ tradeUnion: 1 });
// lọc theo nguồn tuyển, listBySource
internSchema.index({ source: 1 });
// lọc theo xí nghiệp, listByTradeUnionAndCompany
internSchema.index({ companySelect: 1 });
// lọc theo chương trình
internSchema.index({ type: 1 });
// lọc theo năm xuất cảnh (khoảng ngày)
internSchema.index({ departureDate: 1 });
// sắp xếp theo tên
internSchema.index({ name: 1 });
// sắp xếp theo tuổi (age ánh xạ sang birthday)
internSchema.index({ birthday: 1 });
// lấy thực tập sinh theo đơn hàng
internSchema.index({ orderId: 1 });

const Intern = mongoose.models.Intern || mongoose.model('Intern', internSchema);

export default Intern;
