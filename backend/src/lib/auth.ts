import { betterAuth } from 'better-auth';
import { prisma } from './prisma';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env } from '../config/env';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.NODE_ENV === 'production', // Enable in production
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'USER',
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.CORS_ORIGINS || [],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

