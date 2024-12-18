export default () => ({
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  database: {
    globalUri: process.env.MONGODB_GLOBAL_URI,
    uriTemplate: process.env.MONGODB_URI_TEMPLATE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1d',
  },
});
