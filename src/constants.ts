export const ADMIN_EMAILS = [
  "azheriqbal80@gmail.com"
];

// Centralized Storage Keys
export const STORAGE_KEYS = {
  PERSISTED_USER: "nx_persisted_user",
  LOGGED_IN: "nx_logged_in",
  MOCK_API: "nxclip_mock_api",
  USE_REAL_API: "nx_use_real_api",
  API_ENV: "nxclip_api_env",
  REMEMBER_ME: "nx_remember_me",
  THEME: "theme",
};

// Gateway Config and Fallbacks
export const GATEWAY_CONFIG = {
  STAGING_FALLBACK: "https://staging-api.nxclip.ai",
  PRODUCTION_FALLBACK: "https://api-gateway-216098834386.us-central1.run.app",
  DEV_FALLBACK: "http://localhost:3000",
};

// Centralized mock admin user credentials/info
export const FALLBACK_USER_CONFIG = {
  uid: "usr_azheriqbal",
  email: "azheriqbal80@gmail.com",
  username: "azheriqbal",
  displayName: "Azher Iqbal",
  plan: "STUDIO",
  role: "admin",
  password: "Password123!",
  emailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
