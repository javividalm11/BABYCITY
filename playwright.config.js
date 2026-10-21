import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  globalTeardown: './tests/browser-teardown.mjs',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    headless: true,
    launchOptions:
      process.platform === 'win32'
        ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }
        : {},
  },
  webServer: {
    command: 'node tests/browser-server.mjs',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: false,
  },
  reporter: 'list',
});
