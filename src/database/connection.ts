import client from "./config";

const startDataBase = async (): Promise<void> => {
  await client.connect();
  console.log("Database connected!");
};

export default startDataBase;
