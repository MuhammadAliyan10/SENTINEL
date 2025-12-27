# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of SENTINEL seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Security vulnerabilities should **never** be reported through public GitHub issues, discussions, or pull requests.

### 2. Report Privately

Send an email to the maintainers with:

- **Subject**: `[SECURITY] Brief description of the vulnerability`
- **Description**: A detailed explanation of the vulnerability
- **Steps to Reproduce**: Clear steps to reproduce the issue
- **Impact Assessment**: What could an attacker do with this vulnerability?
- **Suggested Fix**: If you have ideas on how to fix it

### 3. What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Initial Assessment**: Within 7 days, we'll provide an initial assessment
- **Fix Timeline**: Critical issues will be addressed within 14 days
- **Disclosure**: We'll coordinate with you on public disclosure timing

## Security Measures in SENTINEL

### Authentication

- **Supabase Auth** with secure session management
- **Rate limiting** on login attempts (5 attempts, 15-minute lockout)
- **Timing-safe password comparison** to prevent timing attacks
- **HTTP-only cookies** for session tokens

### Data Protection

- **HMAC-SHA256 signed QR codes** with 5-minute expiry
- **Row Level Security (RLS)** on all database tables
- **Input validation** using Zod schemas
- **SQL injection prevention** via Prisma ORM

### Access Control

- **Role-based access control** (SUPER_ADMIN, CR, GR, GUARD, STUDENT)
- **Route middleware** protecting sensitive pages
- **Account deactivation** support for immediate access revocation

## Known Security Considerations

### Production Deployment

Ensure the following before deploying to production:

1. **Environment Variables**: Never commit `.env` files
2. **Database URL**: Use connection pooling (PgBouncer)
3. **CORS**: Configure allowed origins properly
4. **Rate Limiting**: Enable at infrastructure level (Vercel/Cloudflare)

### Mobile App

1. **Certificate Pinning**: Consider implementing for production
2. **Secure Storage**: Use `expo-secure-store` for sensitive data
3. **Code Obfuscation**: Enable for production builds

## Security Best Practices for Users

### Administrators

- Use strong, unique passwords
- Enable 2FA on your Supabase account
- Regularly audit user access and permissions
- Monitor audit logs for suspicious activity

### Guards

- Never share login credentials
- Log out when not actively scanning
- Report lost or stolen devices immediately

### Students

- Keep your activation token private
- Do not screenshot and share your QR code
- Report suspicious activity immediately

## Vulnerability Disclosure Policy

We follow a **90-day disclosure policy**:

1. Vulnerability is reported privately
2. We acknowledge and begin investigation
3. Fix is developed and tested
4. Fix is deployed to production
5. After 90 days (or when fix is deployed), vulnerability may be publicly disclosed

We credit security researchers who follow responsible disclosure practices.

---

Thank you for helping keep SENTINEL secure! 🔒
