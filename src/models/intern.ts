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
      type: Number,
      // required: true,
    },
    rightEye: {
      type: Number,
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
    departureDate:{
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
      type: String,
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
      type: String,
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
  },
  {
    timestamps: true,
  }
);

const Intern = mongoose.models.Intern || mongoose.model('Intern', internSchema);

export default Intern;
