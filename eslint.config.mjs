import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import tseslint from 'typescript-eslint';

export default [
  // Correctly include the recommended flat config for security rules
  firebaseRulesPlugin.configs['flat/recommended'],
  
  // Standard TS linting
  ...tseslint.configs.recommended,
  
  // Optional: Add custom rules or project-specific overrides here
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    }
  }
];
