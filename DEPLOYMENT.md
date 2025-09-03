# 🚀 Secure Deployment Guide

## Overview

This guide provides step-by-step instructions for securely deploying the Solana Token Creator while protecting sensitive credentials.

## 🔐 Security Prerequisites

### 1. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set expiration and select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. Generate token and **copy it immediately** (you won't see it again)

### 2. Repository Secrets Setup

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the following secrets:
   - **Name:** `GITHUB_TOKEN`
   - **Value:** Your personal access token from step 1

## 📝 Configuration Steps

### 1. Update Frontend Configuration

1. Copy the example configuration:
   ```bash
   cp config.example.js config.js
   ```

2. Edit `config.js` with your actual values:
   ```javascript
   const CONFIG = {
       GITHUB_OWNER: 'your-actual-username',
       GITHUB_REPO: 'your-actual-repo-name',
       // ... other settings
   };
   ```

3. Update `app.js` to use the configuration:
   ```javascript
   // Replace hardcoded values with:
   const GITHUB_OWNER = CONFIG.GITHUB_OWNER;
   const GITHUB_REPO = CONFIG.GITHUB_REPO;
   ```

### 2. Enable GitHub Actions

1. Go to your repository → Actions tab
2. Click "I understand my workflows, go ahead and enable them"
3. Set workflow permissions:
   - Settings → Actions → General
   - Workflow permissions: "Read and write permissions"
   - Allow GitHub Actions to create and approve pull requests: ✅

## 🌐 Deployment Options

### Option A: GitHub Pages (Recommended)

1. Go to repository Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `main` / `(root)`
4. Click "Save"
5. Your app will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME`

### Option B: Netlify

1. Connect your GitHub repository to Netlify
2. Build settings:
   - Build command: (leave empty)
   - Publish directory: `/`
3. Deploy site

### Option C: Vercel

1. Import your GitHub repository to Vercel
2. Framework preset: "Other"
3. Deploy with default settings

### Option D: Local Development

```bash
# Install dependencies
npm install

# Start local server
npm start
# or
python -m http.server 8000
```

## 🧪 Testing Your Deployment

### 1. Pre-deployment Checklist

- [ ] GitHub token stored as repository secret
- [ ] Frontend configuration updated
- [ ] No sensitive data in code
- [ ] GitHub Actions enabled
- [ ] Workflow permissions configured

### 2. Test on Devnet

1. Connect Phantom wallet to Devnet
2. Create a test token with minimal supply
3. Verify GitHub Actions workflow runs successfully
4. Check that artifacts are generated
5. Confirm token appears on Solana Explorer (devnet)

### 3. Production Deployment

Only after successful devnet testing:

1. Switch wallet to Mainnet
2. Ensure sufficient SOL for transaction fees
3. Create production tokens
4. Monitor costs and transaction success

## 🛡️ Security Best Practices

### Do's ✅

- Store tokens as repository secrets
- Test on devnet first
- Use separate wallets for testing/production
- Monitor GitHub Actions usage
- Enable branch protection rules
- Regular security audits
- Keep dependencies updated

### Don'ts ❌

- Never commit tokens to code
- Don't use production wallets for testing
- Avoid hardcoding sensitive values
- Don't skip devnet testing
- Never share private keys
- Don't ignore security alerts

## 🔧 Environment Variables (Advanced)

For enhanced security, use environment variables:

```javascript
// In your deployment platform
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo
SOLANA_NETWORK=devnet
```

## 📊 Monitoring and Maintenance

### GitHub Actions Monitoring

1. Set up workflow notifications
2. Monitor usage limits
3. Review failed workflows
4. Update dependencies regularly

### Security Monitoring

1. Enable Dependabot alerts
2. Review security advisories
3. Monitor unusual activity
4. Regular access reviews

## 🆘 Troubleshooting

### Common Issues

1. **Workflow fails with authentication error**
   - Check GitHub token permissions
   - Verify token is stored as repository secret
   - Ensure token hasn't expired

2. **Frontend can't trigger workflows**
   - Verify repository and username are correct
   - Check GitHub Actions are enabled
   - Confirm workflow permissions

3. **Token creation fails**
   - Test on devnet first
   - Check wallet has sufficient SOL
   - Verify Solana network status

### Getting Help

1. Check GitHub Actions logs
2. Review Solana Explorer for transaction details
3. Test with minimal token parameters
4. Verify all configuration steps

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Solana Documentation](https://docs.solana.com/)
- [SPL Token Documentation](https://spl.solana.com/token)
- [Phantom Wallet Guide](https://help.phantom.app/)

---

**Remember:** Security is paramount when dealing with blockchain applications. Always test thoroughly and never expose sensitive credentials.