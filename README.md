# Solana Token Creator

A comprehensive platform for creating Solana SPL tokens with a GitHub Pages frontend and GitHub Actions backend. This project allows users to connect their Phantom wallet and create tokens on both Solana devnet and mainnet through an intuitive web interface.

## 🌟 Features

- **Web-based Interface**: Clean, responsive frontend hosted on GitHub Pages
- **Phantom Wallet Integration**: Seamless wallet connection and transaction signing
- **Dual Network Support**: Create tokens on both devnet and mainnet
- **Automated Backend**: GitHub Actions workflow handles token creation
- **Comprehensive Logging**: Detailed logs and reports for each token creation
- **Artifact Management**: Generated files and logs saved as GitHub Actions artifacts
- **Advanced Operations**: Rust-based tools for token verification and analysis

## 🏗️ Architecture

### Frontend (GitHub Pages)
- **HTML/CSS/JavaScript**: Static site with modern UI
- **Phantom Wallet SDK**: Web3 wallet integration
- **GitHub API**: Triggers backend workflows via `repository_dispatch`

### Backend (GitHub Actions)
- **Ubuntu Runner**: Automated environment setup
- **Multi-language Support**: Python, Rust, and Solana CLI
- **Token Creation Pipeline**: End-to-end token creation process
- **Artifact Storage**: Results saved as downloadable artifacts

## 🚀 Quick Start

### Prerequisites

- GitHub account
- Phantom wallet browser extension
- SOL tokens for transaction fees

### Setup

1. **Fork this repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/" (root) folder
   - Save settings

3. **Configure Repository Secrets** (Optional)
   - Go to Settings → Secrets and variables → Actions
   - Add any required secrets for mainnet operations

4. **Configuration Setup**
   
   **For Demo Mode (Default):**
   - No configuration needed - application runs in demo mode
   - Perfect for testing the interface and workflow
   
   **For Real Token Creation:**
   
   a) **GitHub Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create token with `repo` and `actions` permissions
   - Copy the generated token
   
   b) **Repository Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add `SOLANA_PRIVATE_KEY`: Your wallet private key (base58 encoded)
   - Add `SOLANA_RPC_URL`: Solana RPC endpoint (optional)
   
   c) **Configuration for Real Token Creation:**
     - Update `config.js` with your actual values:
       - `GITHUB_OWNER`: Your GitHub username
       - `GITHUB_REPO`: Your repository name  
       - `PERSONAL_ACCESS_TOKEN`: Your GitHub Personal Access Token
     - **Note:** `config.js` is now included in the repository for GitHub Pages deployment
   
   **For GitHub Pages:**
   - Configure `config.js` with your GitHub token to enable real token creation
   - The application will automatically use real mode when properly configured

5. **Access the Application**
   - Visit `https://your-username.github.io/solana-token-creator`
   - Connect your Phantom wallet
   - Start creating tokens!

## 📖 Usage Guide

### Creating a Token

1. **Connect Wallet**
   - Click "Connect Phantom Wallet"
   - Approve the connection in your wallet

2. **Select Network**
   - Choose between Devnet (free, for testing) or Mainnet (requires SOL)

3. **Fill Token Details**
   - **Name**: Your token's display name
   - **Symbol**: Short ticker symbol (e.g., "MYTOKEN")
   - **Description**: Brief description of your token
   - **Total Supply**: Number of tokens to create
   - **Decimals**: Decimal places (usually 6 or 9)
   - **Image URL**: Optional logo/image for your token

4. **Create Token**
   - Click "Create Token"
   - Approve the transaction in your wallet
   - Wait for the GitHub Actions workflow to complete

5. **Download Results**
   - Check the "Recent Creations" section
   - Download artifacts containing token details and logs

### Monitoring Progress

- **Workflow Status**: Check the Actions tab in your repository
- **Real-time Updates**: The frontend polls for workflow completion
- **Detailed Logs**: View step-by-step execution in GitHub Actions

## 🛠️ Development

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/solana-token-creator.git
   cd solana-token-creator
   ```

2. **Install dependencies**
   ```bash
   # Python dependencies
   pip install -r requirements.txt
   
   # Rust dependencies
   cd rust-programs
   cargo build --release
   cd ..
   ```

3. **Start local server**
   ```bash
   npm start
   # or
   python -m http.server 8000
   ```

4. **Access locally**
   - Open `http://localhost:8000`

### Project Structure

```
solana-token-creator/
├── index.html              # Main frontend page
├── app.js                  # Frontend JavaScript logic
├── package.json            # Node.js configuration
├── requirements.txt        # Python dependencies
├── .gitignore             # Git ignore rules
├── .github/
│   └── workflows/
│       └── create-token.yml # GitHub Actions workflow
├── scripts/
│   ├── create_token.py     # Python token creation script
│   └── generate_report.py  # Report generation script
└── rust-programs/
    ├── Cargo.toml          # Rust project configuration
    └── src/
        └── main.rs         # Rust token operations
```

### Key Components

#### Frontend (`app.js`)
- `SolanaTokenCreator` class handles wallet integration
- Form validation and submission
- GitHub API integration for triggering workflows
- Real-time status updates

#### Backend Workflow (`.github/workflows/create-token.yml`)
- Environment setup (Solana CLI, Python, Rust)
- Token creation pipeline
- Artifact generation and storage
- Error handling and logging

#### Python Scripts (`scripts/`)
- `create_token.py`: Core token creation logic
- `generate_report.py`: HTML report generation

#### Rust Programs (`rust-programs/`)
- Advanced token operations
- Blockchain verification
- Performance-critical tasks

## 🔧 Configuration

### Environment Variables

The GitHub Actions workflow supports these environment variables:

- `SOLANA_NETWORK`: Target network (devnet/mainnet)
- `TOKEN_NAME`: Name of the token to create
- `TOKEN_SYMBOL`: Symbol of the token
- `TOKEN_DESCRIPTION`: Token description
- `TOKEN_SUPPLY`: Total supply
- `TOKEN_DECIMALS`: Decimal places
- `TOKEN_IMAGE_URL`: Image URL
- `WALLET_ADDRESS`: Creator wallet address

### Customization

#### Frontend Styling
Modify the CSS in `index.html` to customize the appearance:
```css
/* Add your custom styles */
.custom-button {
    background: linear-gradient(45deg, #your-color1, #your-color2);
}
```

#### Backend Logic
Extend the Python scripts for additional functionality:
```python
# In scripts/create_token.py
def custom_token_logic(self):
    # Add your custom logic here
    pass
```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys to the repository
- **Mainnet Operations**: Use repository secrets for sensitive data
- **Wallet Security**: Always verify transactions in your wallet
- **Network Selection**: Double-check network before creating tokens
- **Token Verification**: Verify token creation through blockchain explorers

## 🐛 Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Ensure Phantom wallet is installed and unlocked
   - Check if the site is allowed in wallet settings
   - Try refreshing the page

2. **Workflow Failed**
   - Check GitHub Actions logs for detailed error messages
   - Verify repository permissions and secrets
   - Ensure sufficient SOL balance for mainnet operations

3. **Token Creation Failed**
   - Verify network connectivity
   - Check Solana network status
   - Ensure valid token parameters

4. **CONFIG is not defined Error**
   - When running locally: Make sure you've created `config.js` from `config.example.js`
   - When using GitHub Pages: This is expected as `config.js` is not included in the repository
   - The app will show a warning and use default values for GitHub repository information

5. **Artifacts Not Generated**
   - Check workflow completion status
   - Verify artifact retention settings
   - Look for errors in the workflow logs

### Debug Mode

Enable debug logging by setting environment variables:
```bash
export SOLANA_LOG_LEVEL=debug
export RUST_LOG=debug
```

## 📚 API Reference

### GitHub Repository Dispatch

The frontend triggers the backend using GitHub's `repository_dispatch` API:

```javascript
POST /repos/{owner}/{repo}/dispatches
{
  "event_type": "create_token",
  "client_payload": {
    "network": "devnet",
    "tokenName": "My Token",
    "tokenSymbol": "MTK",
    "tokenDescription": "My awesome token",
    "totalSupply": "1000000",
    "decimals": "6",
    "imageUrl": "https://example.com/image.png",
    "walletAddress": "wallet_public_key"
  }
}
```

### Workflow Outputs

The GitHub Actions workflow generates these artifacts:
- `token-creation-report.html`: Detailed HTML report
- `token-metadata.json`: Token metadata
- `creation-logs.txt`: Execution logs
- `token-addresses.json`: Important addresses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation for any changes
- Ensure all workflows pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Solana Labs](https://solana.com/) for the amazing blockchain platform
- [Phantom Wallet](https://phantom.app/) for wallet integration
- [GitHub](https://github.com/) for hosting and automation
- The Solana developer community for tools and resources

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/solana-token-creator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/solana-token-creator/discussions)
- **Documentation**: This README and inline code comments

---

**⚠️ Disclaimer**: This tool is for educational and development purposes. Always verify token creation on blockchain explorers and exercise caution when creating tokens on mainnet. The authors are not responsible for any losses or issues arising from the use of this software.