import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

config({ path: '.env.test' })

export default defineConfig({
  test: {
    env: {
      SUPABASE_URL:             process.env.SUPABASE_URL             ?? '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
  },
})
