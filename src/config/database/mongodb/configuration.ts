import { registerAs } from '@nestjs/config';

export default registerAs('mongodb', () => ({
	protocol: process.env.MONGODB_PROTOCOL,
	host: process.env.MONGODB_HOST,
	port: process.env.MONGODB_PORT,
	database: process.env.MONGODB_DATABASE,
}));
