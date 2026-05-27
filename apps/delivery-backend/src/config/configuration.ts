export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),

  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/delivery_db',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
  },

  cors: {
    origins: (process.env.CORS_ORIGIN ?? 'http://localhost:8081').split(','),
  },

  ws: {
    namespace: process.env.WS_NAMESPACE ?? '/orders',
  },
});
