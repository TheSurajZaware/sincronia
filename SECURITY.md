# Security Policy

## Supported Versions

Sincronia `2.x` receives active security updates.

## Reporting a Vulnerability

Please report security issues privately to the maintainers instead of opening a public issue.

Include:

- Impacted version
- Reproduction steps
- Potential impact
- Suggested mitigation (if known)

## Security Principles

- Never commit credentials, tokens, or secrets.
- Prefer environment-scoped secrets in CI.
- Use protected deployment environments with manual approvals for production.
- Use `--dry-run` for high-risk deploy validations.
