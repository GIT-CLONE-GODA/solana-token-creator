// Configuration Example for Solana Token Creator
// Copy this file to config.js and update with your actual values
// NEVER commit config.js to version control!
//
// IMPORTANT FOR GITHUB PAGES DEPLOYMENT:
// When deploying to GitHub Pages, config.js will not be included (it's in .gitignore).
// The application will fall back to default values in app.js.
// For production use, create config.js locally or use environment variables.

const CONFIG = {
    // GitHub Configuration
    GITHUB_OWNER: 'YOUR_GITHUB_USERNAME',     // Replace with your GitHub username
    GITHUB_REPO: 'YOUR_REPOSITORY_NAME',      // Replace with your repository name
    PERSONAL_ACCESS_TOKEN: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN', // Required for triggering workflows
    
    // Network Configuration
    DEFAULT_NETWORK: 'devnet',                // 'devnet' or 'mainnet'
    
    // UI Configuration
    APP_NAME: 'Solana Token Creator',
    APP_VERSION: '1.0.0',
    
    // Security Notes:
    // - PERSONAL_ACCESS_TOKEN: Personal Access Token with 'repo' and 'actions' permissions
    // - GitHub secrets should ONLY be stored as repository secrets (SOLANA_PRIVATE_KEY, etc.)
    // - Never include private keys or sensitive tokens in frontend code
    // - Always test on devnet before using mainnet
    // - Use environment variables for sensitive configuration in production
};

// Export for use in your application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}