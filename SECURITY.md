# Snipit Security Guidelines

## Environment Variables and API Keys

### Best Practices

1. **Never hardcode sensitive values in source code**
   - API keys, passwords, tokens, and other secrets should always be stored as environment variables
   - Use the `.env.local` file for local development (already in `.gitignore`)
   - For production deployment, use the environment variable system of your hosting provider

2. **Use the provided `.env.example` file**
   - Copy this file to `.env.local` and add your actual values
   - Never commit the actual `.env.local` file to version control

3. **Default to empty strings for missing environment variables**
   ```typescript
   // GOOD - defaults to empty string
   const apiKey = process.env.API_KEY || '';
   
   // BAD - has hardcoded fallback
   const apiKey = process.env.API_KEY || 'MY_ACTUAL_KEY_HERE';
   ```

4. **Add validation for critical environment variables**
   ```typescript
   const apiKey = process.env.API_KEY || '';
   
   if (!apiKey) {
     console.error('API_KEY is not set in environment variables');
     // Handle the error appropriately
   }
   ```

5. **Never log API keys, not even partially**
   ```typescript
   // GOOD
   console.log('API Key Status:', apiKey ? 'CONFIGURED' : 'NOT CONFIGURED');
   
   // BAD
   console.log('API Key:', apiKey); // Full exposure
   console.log('API Key (partial):', apiKey.substring(0, 5) + '...'); // Partial exposure
   ```

## Versioning and Git

1. **Check the `.gitignore` file**
   - Ensure it contains all patterns for sensitive files
   - Environment files (`.env`, `.env.local`, etc.)
   - Log files that may contain sensitive data
   - Certificate and key files

2. **Before committing, scan for secrets**
   - Use tools like `git-secrets` or `pre-commit` hooks
   - Review changes carefully before pushing to remote repositories

3. **If a secret is accidentally committed**
   - Change the secret immediately (revoke the old one)
   - Follow the repository host's guide to remove sensitive data (e.g., GitHub's guide to removing sensitive data)

## API Security

1. **Validate all inputs**
   - Use strict typing with TypeScript
   - Validate user inputs on both client and server sides

2. **Implement proper authentication**
   - Ensure JWT tokens are properly verified
   - Use secure, random JWT secrets

3. **Limit information exposure in API responses**
   - Only return necessary data
   - Avoid exposing internal IDs, file paths, or other sensitive information

## Testing

1. **Testing with sensitive values**
   - Use mock APIs and test values for unit tests
   - Never use production credentials in test code

2. **CI/CD security**
   - Use encrypted secrets in your CI/CD platform
   - Ensure test logs don't expose sensitive information

## For Snipit Maintainers

1. **Regular security audits**
   - Review code for hardcoded secrets
   - Check for outdated dependencies with known vulnerabilities

2. **Documentation**
   - Keep this security guide updated
   - Document any security-related configuration requirements

3. **Training**
   - Ensure all developers understand these security practices
   - Review security practices during code reviews

By following these guidelines, we can maintain a secure codebase and protect our users' data.
