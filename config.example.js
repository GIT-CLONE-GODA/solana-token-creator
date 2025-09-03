// Configuration Example for Solana Token Creator
// Copy this file to config.js and update with your actual values
// NEVER commit config.js to version control!

const CONFIG = {
    // GitHub Configuration
    GITHUB_OWNER: 'YOUR_GITHUB_USERNAME',     // Replace with your GitHub username
    GITHUB_REPO: 'YOUR_REPOSITORY_NAME',      // Replace with your repository name
    
    // Network Configuration
    DEFAULT_NETWORK: 'devnet',                // 'devnet' or 'mainnet'
    
    // UI Configuration
    APP_NAME: 'Solana Token Creator',
    APP_VERSION: '1.0.0',
    
    // Security Notes:
    // - GitHub tokens should ONLY be stored as repository secrets
    // - Never include private keys or tokens in frontend code
    // - Always test on devnet before using mainnet
    // - Use environment variables for sensitive configuration
};

// Export for use in your application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}