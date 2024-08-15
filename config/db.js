import { connect } from 'mongoose';

const db = async () => {
  try {
    const {
      connection: { host, name },
    } = await connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB at ${host}, database: ${name}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export default db;