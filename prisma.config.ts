import { config } from 'dotenv'
import { resolve } from 'path'
import { defineConfig, env } from 'prisma/config'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    // seed: './prisma/seed.ts',
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})