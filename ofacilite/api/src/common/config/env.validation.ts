import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  APP_URL: Joi.string().uri().default('http://localhost:3000'),

  CLIENT_URL: Joi.string().uri().optional(),

  API_KEY: Joi.string().min(24).required(),

  MISTRAL_API_KEY: Joi.string().min(16).required(),

  MAX_UPLOAD_MB: Joi.number().integer().min(1).max(50).default(8),

  UPLOAD_TTL_HOURS: Joi.number().integer().min(1).default(24),

  THROTTLE_TTL_MS: Joi.number().integer().positive().default(60_000),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(20),
});
