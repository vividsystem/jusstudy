# Contributing to [jusstudy]

Thank you for your interest in contributing! This guide will help you get started with our development workflow.

## Table of Contents

- [Branch Workflow](#branch-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Branch Workflow

**Important**: Never commit directly to the `main` branch. All changes must go through pull requests.

### Creating a Feature Branch

1. **Update main branch**:
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a new branch** with a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Branch Naming Convention

Use one of these prefixes:
- `feature/` - New features (e.g., `feature/user-authentication`)
- `fix/` - Bug fixes (e.g., `fix/login-error`)
- `docs/` - Documentation changes (e.g., `docs/api-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/database-queries`)
- `test/` - Adding or updating tests (e.g., `test/user-service`)

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification for clear and consistent commit history.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Examples

**Simple commit**:
```bash
git commit -m "feat: add user login functionality"
```

**With scope**:
```bash
git commit -m "fix(auth): resolve token expiration issue"
```

**With body** (use `git commit` without `-m` to open editor):
```
feat(api): add endpoint for user profile updates

Added PUT /api/users/:id endpoint to allow users to update
their profile information including name, email, and bio.

Closes #123
```

### Commit Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep subject line under 50 characters
- Don't end subject line with a period
- Separate subject from body with a blank line
- Wrap body at 72 characters
- Explain what and why, not how

## Pull Request Process

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**: Go to the repository on GitHub and click "New Pull Request"

3. **Fill out the PR template** with:
   - Clear description of changes
   - Related issue numbers (e.g., "Closes #123")
   - Screenshots (if applicable)
   - Testing steps

4. **Address review comments**: Make requested changes and push new commits

5. **Keep PR updated**: Rebase or merge main into your branch if conflicts arise
   ```bash
   git fetch upstream
   git rebase upstream/main
   # or
   git merge upstream/main
   ```

### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Write clear PR titles following conventional commit format
- Link related issues
- Update documentation if needed
