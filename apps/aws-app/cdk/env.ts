import {z} from 'zod';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}

const envVariables = z.object({
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_HANDLER_VERIFY_HEADER: z.string(),
  AWS_REGION: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
});

envVariables.parse(process.env);
