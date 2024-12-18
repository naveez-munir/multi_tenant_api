import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  globalUri: process.env.MONGODB_GLOBAL_URI,
  uriTemplate: process.env.MONGODB_URI_TEMPLATE,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
}));
