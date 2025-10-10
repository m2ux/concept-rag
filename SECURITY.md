# Security Guidelines

## API Key Management

This project uses OpenRouter API for AI summarization. **Never commit API keys to version control.**

### ✅ Secure Setup

1. **Use environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your actual API key
   export OPENROUTER_API_KEY=sk-or-v1-your-actual-key
   ```

2. **The `.env` file is gitignored** - it won't be committed

3. **All API usage properly reads from environment:**
   ```typescript
   const openrouterApiKey = process.env.OPENROUTER_API_KEY;
   ```

### ❌ What NOT to do

- Don't hardcode API keys in source files
- Don't commit `.env` files  
- Don't share API keys in chat/email
- Don't use API keys in CI logs

### 🔍 Verification

Run this to check for accidentally committed secrets:
```bash
git log --all -p | grep -i "sk-or-v1"  # Should return nothing
```

## Reporting Security Issues

If you find security vulnerabilities, please report them privately to the maintainers.
