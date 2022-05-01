// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  reporter: 'html',
  webServer: {
    command: 'node test/serve.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
};
export default config;
