# Contributing to SENTINEL

First off, thank you for considering contributing to SENTINEL! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SENTINEL.git
   cd SENTINEL
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/MuhammadAliyan10/SENTINEL.git
   ```

## Development Setup

### Web Application (sentinel-web)

```bash
cd sentinel-web
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

### Mobile Application (sentinel-guard)

```bash
cd sentinel-guard
npm install
cp .env.example .env
# Fill in your environment variables
npx expo start
```

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (via Supabase)
- Expo CLI (for mobile development)

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed and expected**
- **Include your environment details** (OS, Node version, etc.)

### Suggesting Features

Feature requests are welcome! Please provide:

- **A clear and descriptive title**
- **A detailed description of the proposed feature**
- **Explain why this feature would be useful**
- **Include mockups or examples if applicable**

### Code Contributions

1. Create a new branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. Make your changes following our [coding standards](#coding-standards)

3. Test your changes thoroughly

4. Commit your changes following the [commit message guidelines](#commit-message-guidelines)

5. Push to your fork and submit a Pull Request

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** before submitting
4. **Update the CHANGELOG.md** with notable changes
5. **Request review** from at least one maintainer
6. **Address review feedback** promptly

### PR Title Format

```
type(scope): description

Examples:
feat(auth): add biometric login support
fix(scanner): resolve race condition in QR processing
docs(readme): update installation instructions
```

## Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Prefer **functional components** with hooks in React
- Use **async/await** over raw promises

### File Naming

- Components: `PascalCase.tsx` (e.g., `ResultOverlay.tsx`)
- Utilities: `camelCase.ts` (e.g., `security.ts`)
- Constants: `SCREAMING_SNAKE_CASE`

### Code Organization

```
src/
├── actions/        # Server actions
├── app/            # Next.js app router pages
├── components/     # React components
│   ├── ui/         # Reusable UI components
│   └── features/   # Feature-specific components
├── lib/            # Utilities and configurations
└── types/          # TypeScript type definitions
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```
feat(scanner): add offline queue for network failures

- Implement local storage queue for scans
- Add background sync when connection restored
- Show pending scans indicator

Closes #123
```

```
fix(auth): prevent race condition in session refresh

The session refresh was firing multiple times causing
duplicate API calls. Added debouncing to fix.

Fixes #456
```

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

---

Thank you for contributing! 🙏
