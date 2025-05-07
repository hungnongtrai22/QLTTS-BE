import mongoose, { ConnectionStates } from 'mongoose';

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

  const db = await mongoose.connect(process.env.MONGODB_URL as string);
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
