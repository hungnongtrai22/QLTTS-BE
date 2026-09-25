import mongoose, { ConnectionStates } from 'mongoose';

require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

interface Connection {
  isConnected?: ConnectionStates;
}

const connection: Connection = {};

const connectDB = async (): Promise<void> => {
  if (connection.isConnected) {
    console.log('Already connected to the database.');
    return;
  }

  if (mongoose.connections.length > 0) {
    connection.isConnected = mongoose.connections[0].readyState;
    if (connection.isConnected === 1) {
      console.log('Use previous connection to the database.');
      return;
    }
    await mongoose.disconnect();
  }

  // Không dùng NEXT_PUBLIC_MONGODB_URL: tiền tố NEXT_PUBLIC_ khiến Next.js nhúng biến
  // vào bundle phía trình duyệt — chuỗi kết nối CSDL tuyệt đối không được nằm ở đó.
  const uri = process.env.MONGODB_URL;

  if (!uri) {
    throw new Error('Server missing MONGODB_URL');
  }

  const db = await mongoose.connect(uri);
  console.log('New connection to the database.');
  connection.isConnected = db.connections[0].readyState;
};

const disconnectDB = async (): Promise<void> => {
  if (connection.isConnected) {
    if (process.env.NODE_ENV === 'production') {
      await mongoose.disconnect();
      connection.isConnected = 0; // use 0 instead of false
    } else {
      console.log('Not disconnecting from the database.');
    }
  }
};

const db = { connectDB, disconnectDB };

export default db;
