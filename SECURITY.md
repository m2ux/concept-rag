# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Concept-RAG, please report it by:

1. **Email**: Send details to the maintainers (check package.json for contact)
2. **Private Security Advisory**: Use GitHub's private security advisory feature
3. **Do NOT** create a public GitHub issue for security vulnerabilities

We will acknowledge receipt within 48 hours and provide a detailed response within 5 business days.

---

## API Key & Secret Management

### Overview

Concept-RAG uses API keys for:
- **OpenRouter**: Concept extraction and summarization (required)
- **OpenAI**: Optional embedding service
- **HuggingFace**: Optional embedding service (API or local)

**Critical**: API keys are sensitive credentials that must never be committed to version control.

### Best Practices

#### ✅ DO:

1. **Use Environment Variables**
   - Store API keys in `.env` file (already in `.gitignore`)
   - Use separate keys for development and production
   - Never hardcode keys in source code

2. **Secure Storage**
   - Keep `.env` file locally only
   - Use secret management systems in production (AWS Secrets Manager, Vault, etc.)
   - Set restrictive file permissions: `chmod 600 .env`

3. **Key Hygiene**
   - Rotate API keys every 90 days minimum
   - Use read-only or restricted keys when possible
   - Set spending limits on provider accounts
   - Enable 2FA on all provider accounts

4. **Monitoring**
   - Monitor API usage for unexpected spikes
   - Set up billing alerts
   - Review access logs regularly
   - Track key usage by environment (dev/staging/prod)

5. **Team Collaboration**
   - Share `.env.example` (template only, no real keys)
   - Use secret sharing tools (1Password, Bitwarden) for team keys
   - Document which keys are needed in README

#### ❌ DON'T:

1. **Never Commit Secrets**
   - Don't add `.env` to git (already in `.gitignore`)
   - Don't commit API keys in code or config files
   - Don't include keys in screenshots or documentation
   - Don't paste keys in chat, email, or issues

2. **Avoid Exposure**
   - Don't share keys in public channels
   - Don't use production keys in development
   - Don't log API keys (even in debug mode)
   - Don't include keys in error messages

3. **Don't Use Weak Keys**
   - Don't use root/admin API keys
   - Don't reuse keys across projects
   - Don't use default or example keys

### Git Protection

The repository includes protection against accidental key commits:

1. **`.gitignore`**
   - `.env` files are excluded (lines 78-85, 266-267)
   - Pattern matches all `.env` variants except `.env.example`

2. **Verification**
   ```bash
   # Check if .env is properly ignored
   git check-ignore -v .env
   # Should output: .gitignore:266:.env	.env
   
   # Verify .env is not tracked
   git status .env
   # Should output: "On branch X... no changes added..."
   ```

3. **Additional Tools** (recommended)
   - Install `git-secrets`: Prevents committing secrets
   - Use pre-commit hooks to scan for API key patterns
   - Enable GitHub secret scanning (automatic for public repos)

### Setup Checklist

When setting up Concept-RAG:

- [ ] Copy `.env.example` to `.env`
- [ ] Add your actual API keys to `.env`
- [ ] Verify `.env` is in `.gitignore`
- [ ] Check `.env` file permissions: `chmod 600 .env`
- [ ] Confirm `.env` is not tracked: `git status .env`
- [ ] Set spending limits on API provider accounts
- [ ] Enable 2FA on OpenRouter/OpenAI/HuggingFace accounts
- [ ] Document which keys are needed for your team

### Key Compromise Response

If you suspect an API key has been compromised:

1. **Immediate Action**
   - Revoke the compromised key immediately
   - Generate a new key
   - Update `.env` with new key
   - Restart services using the new key

2. **Assessment**
   - Check API usage logs for unauthorized activity
   - Review billing for unexpected charges
   - Determine scope of exposure (time, access level)

3. **Prevention**
   - Audit how the key was exposed
   - Update processes to prevent recurrence
   - Consider rotating all keys as precaution
   - Review access control and monitoring

### Environment-Specific Keys

Use different API keys for each environment:

```bash
# Development (.env.development)
OPENROUTER_API_KEY=sk-or-v1-dev-...
OPENAI_API_KEY=sk-proj-dev-...

# Staging (.env.staging)
OPENROUTER_API_KEY=sk-or-v1-staging-...
OPENAI_API_KEY=sk-proj-staging-...

# Production (.env.production)
OPENROUTER_API_KEY=sk-or-v1-prod-...
OPENAI_API_KEY=sk-proj-prod-...
```

Load environment-specific files:
```bash
# Load development keys
cp .env.development .env

# Load production keys (in CI/CD)
cp .env.production .env
```

### Provider-Specific Security

#### OpenRouter
- Create restricted keys with rate limits
- Set monthly spending caps
- Monitor usage at: https://openrouter.ai/activity
- Docs: https://openrouter.ai/docs/security

#### OpenAI
- Use project-scoped keys (not user keys)
- Set usage limits in dashboard
- Monitor usage at: https://platform.openai.com/usage
- Docs: https://platform.openai.com/docs/guides/production-best-practices/api-keys

#### HuggingFace
- Use read-only tokens for inference
- Consider local mode for sensitive data
- Monitor usage at: https://huggingface.co/settings/tokens
- Docs: https://huggingface.co/docs/hub/security-tokens

### Additional Resources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [git-secrets](https://github.com/awslabs/git-secrets)
- [12-Factor App: Config](https://12factor.net/config)

---

## Dependency Security

### Keeping Dependencies Updated

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities automatically
npm audit fix
```

### Dependency Policy

- Review dependencies before adding
- Prefer well-maintained packages
- Keep dependencies up to date
- Monitor security advisories
- Use `npm audit` in CI/CD

### Known Issues

Check `npm audit` output and review:
- [GitHub Security Advisories](https://github.com/advisories)
- [npm Security Advisories](https://www.npmjs.com/advisories)

---

## Data Security

### Document Privacy

When using cloud embedding providers (OpenAI, OpenRouter):
- Document content is sent to external APIs
- Data is processed in accordance with provider privacy policies
- Consider local HuggingFace mode for sensitive documents
- Review provider data retention policies

### Local-First Option

For maximum privacy:
```bash
# Use HuggingFace local mode (no external API calls)
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_USE_LOCAL=true
HUGGINGFACE_MODEL=Xenova/all-MiniLM-L6-v2
```

Note: Requires installing `@xenova/transformers` package.

### Database Security

- LanceDB files are stored locally (`~/.concept_rag` by default)
- Set appropriate file permissions on database directory
- Consider encryption at rest for sensitive documents
- Include database backups in your security plan

---

## Deployment Security

### Production Checklist

- [ ] Use production-grade embedding provider
- [ ] Rotate API keys to production values
- [ ] Set restrictive file permissions
- [ ] Enable HTTPS/TLS for network communication
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting
- [ ] Review and test backup procedures
- [ ] Document incident response procedures

### Container Security

If deploying with Docker:
- Don't include `.env` in image
- Use secrets management (Docker secrets, Kubernetes secrets)
- Run as non-root user
- Scan images for vulnerabilities
- Keep base images updated

---

## Responsible Disclosure

We are committed to working with security researchers and the community to improve Concept-RAG's security. Thank you for helping keep our users safe!
