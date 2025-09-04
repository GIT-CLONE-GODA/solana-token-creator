class SolanaTokenCreator {
    constructor() {
        this.wallet = null;
        this.selectedNetwork = 'devnet';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkWalletConnection();
    }

    bindEvents() {
        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => {
            this.connectWallet();
        });

        // Network selection
        document.querySelectorAll('.network-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectNetwork(e.currentTarget.dataset.network);
            });
        });

        // Form submission
        document.getElementById('tokenForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createToken();
        });
    }

    async checkWalletConnection() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: true });
                this.wallet = response.publicKey.toString();
                this.updateWalletStatus(true);
            } catch (error) {
                console.log('Wallet not connected');
            }
        } else {
            this.showError('Phantom wallet not detected. Please install Phantom wallet extension.');
        }
    }

    async connectWallet() {
        if (!window.solana || !window.solana.isPhantom) {
            this.showError('Phantom wallet not detected. Please install Phantom wallet extension.');
            window.open('https://phantom.app/', '_blank');
            return;
        }

        try {
            const response = await window.solana.connect();
            this.wallet = response.publicKey.toString();
            this.updateWalletStatus(true);
        } catch (error) {
            this.showError('Failed to connect wallet: ' + error.message);
        }
    }

    updateWalletStatus(connected) {
        const statusElement = document.getElementById('walletStatus');
        const connectButton = document.getElementById('connectWallet');
        const tokenForm = document.getElementById('tokenForm');

        if (connected) {
            statusElement.innerHTML = `<span class="connected">Connected: ${this.wallet.substring(0, 8)}...${this.wallet.substring(-8)}</span>`;
            connectButton.textContent = 'Disconnect';
            connectButton.onclick = () => this.disconnectWallet();
            tokenForm.style.display = 'block';
        } else {
            statusElement.innerHTML = '<span class="disconnected">Wallet not connected</span>';
            connectButton.textContent = 'Connect Phantom Wallet';
            connectButton.onclick = () => this.connectWallet();
            tokenForm.style.display = 'none';
        }
    }

    disconnectWallet() {
        if (window.solana && window.solana.disconnect) {
            window.solana.disconnect();
        }
        this.wallet = null;
        this.updateWalletStatus(false);
    }

    selectNetwork(network) {
        this.selectedNetwork = network;
        document.querySelectorAll('.network-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-network="${network}"]`).classList.add('selected');
    }

    async createToken() {
        if (!this.wallet) {
            this.showError('Please connect your wallet first.');
            return;
        }

        const formData = new FormData(document.getElementById('tokenForm'));
        const tokenData = {
            walletAddress: this.wallet,
            network: this.selectedNetwork,
            tokenName: formData.get('tokenName'),
            tokenSymbol: formData.get('tokenSymbol'),
            tokenDescription: formData.get('tokenDescription') || '',
            initialSupply: parseInt(formData.get('initialSupply')),
            decimals: parseInt(formData.get('decimals')),
            imageUrl: formData.get('imageUrl') || '',
            revokeMintAuthority: formData.get('revokeMintAuthority') === 'on',
            revokeFreezeAuthority: formData.get('revokeFreezeAuthority') === 'on'
        };

        // Validate form data
        if (!tokenData.tokenName || !tokenData.tokenSymbol || !tokenData.initialSupply) {
            this.showError('Please fill in all required fields.');
            return;
        }

        if (tokenData.initialSupply <= 0) {
            this.showError('Initial supply must be greater than 0.');
            return;
        }

        if (tokenData.decimals < 0 || tokenData.decimals > 9) {
            this.showError('Decimals must be between 0 and 9.');
            return;
        }

        this.showStatus('Initiating token creation...');
        this.setFormLoading(true);

        try {
            // Trigger GitHub Actions workflow via repository_dispatch
            await this.triggerTokenCreation(tokenData);
        } catch (error) {
            this.showError('Failed to create token: ' + error.message);
            this.setFormLoading(false);
        }
    }

    async triggerTokenCreation(tokenData) {
        // GitHub repository information - UPDATE THESE WITH YOUR ACTUAL VALUES
        let GITHUB_OWNER, GITHUB_REPO;
        
        // Check if CONFIG is defined (local development) or use default values (GitHub Pages)
        if (typeof CONFIG !== 'undefined') {
            GITHUB_OWNER = CONFIG.GITHUB_OWNER;
            GITHUB_REPO = CONFIG.GITHUB_REPO;
        } else {
            // Default values when config.js is not available (e.g., on GitHub Pages)
            GITHUB_OWNER = 'GIT-CLONE-GODA';
            GITHUB_REPO = 'solana-token-creator';
        }
        
        // SECURITY NOTE: Using GitHub Issues API for secure token creation triggering
        // No personal access token required - uses public GitHub API

        // Create issue title and body with token parameters
        const issueTitle = `Token Creation Request: ${tokenData.tokenName} (${tokenData.tokenSymbol})`;
        const issueBody = `**Automated Token Creation Request**

` +
            `**Token Details:**
` +
            `- Name: ${tokenData.tokenName}
` +
            `- Symbol: ${tokenData.tokenSymbol}
` +
            `- Decimals: ${tokenData.decimals}
` +
            `- Supply: ${tokenData.initialSupply}
` +
            `- Network: ${tokenData.network}
` +
            `- Revoke Mint Authority: ${tokenData.revokeMintAuthority}
` +
            `- Revoke Freeze Authority: ${tokenData.revokeFreezeAuthority}
` +
            `- Wallet: ${this.wallet}

` +
            `**JSON Data:**
` +
            `\`\`\`json
${JSON.stringify(tokenData, null, 2)}
\`\`\`

` +
            `This issue was created automatically by the Solana Token Creator application.`;

        const payload = {
            title: issueTitle,
            body: issueBody,
            labels: ['token-creation', 'automated']
        };

        try {
            // Use GitHub's public Issues API (no authentication required for public repos)
            const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Solana-Token-Creator'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const issueData = await response.json();
                this.showSuccess(`Token creation request submitted! Issue #${issueData.number} created. The workflow will start automatically.`);
                this.currentWorkflowData = { GITHUB_OWNER, GITHUB_REPO, tokenData, issueNumber: issueData.number };
                this.pollWorkflowStatus();
            } else if (response.status === 422) {
                throw new Error('Unable to create issue. Please check the repository settings.');
            } else if (response.status === 404) {
                throw new Error('Repository not found. Please check the repository name.');
            } else {
                throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            if (error.message.includes('fetch')) {
                // Network error - fall back to demo mode
                console.log('Network error, falling back to demo mode:', error);
                this.showWarning('Network error detected. Running in demo mode.');
                this.simulateWorkflowProgress();
            } else {
                // API error - show real error
                this.showError('Failed to trigger workflow: ' + error.message);
                this.setFormLoading(false);
            }
        }
    }

    async pollWorkflowStatus() {
        const { GITHUB_OWNER, GITHUB_REPO, tokenData, issueNumber } = this.currentWorkflowData;
        
        this.showStatus('Checking workflow status...');
        
        try {
            // Get recent workflow runs using public API
            const workflowsResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=10`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Solana-Token-Creator'
                }
            });
            
            if (!workflowsResponse.ok) {
                throw new Error(`Failed to fetch workflows: ${workflowsResponse.status}`);
            }
            
            const workflowsData = await workflowsResponse.json();
            const recentRun = workflowsData.workflow_runs[0]; // Get the most recent run
            
            if (!recentRun) {
                throw new Error('No workflow runs found');
            }
            
            this.monitorWorkflowRun(recentRun.id, GITHUB_OWNER, GITHUB_REPO);
            
        } catch (error) {
            console.error('Error polling workflow status:', error);
            this.showWarning('Unable to monitor workflow status. Falling back to simulation.');
            this.simulateWorkflowProgress();
        }
    }
    
    async monitorWorkflowRun(runId, owner, repo) {
        const maxAttempts = 30; // Maximum 5 minutes (30 * 10 seconds)
        let attempts = 0;
        
        const checkStatus = async () => {
            try {
                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Solana-Token-Creator'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch run status: ${response.status}`);
                }
                
                const runData = await response.json();
                
                switch (runData.status) {
                    case 'queued':
                        this.showStatus('Workflow queued...');
                        break;
                    case 'in_progress':
                        this.showStatus('Creating token... This may take a few minutes.');
                        break;
                    case 'completed':
                        if (runData.conclusion === 'success') {
                            this.showSuccess('Token creation completed successfully!');
                            this.fetchWorkflowArtifacts(runId, owner, repo);
                        } else {
                            this.showError(`Workflow failed: ${runData.conclusion}`);
                        }
                        this.setFormLoading(false);
                        return;
                    default:
                        this.showStatus(`Workflow status: ${runData.status}`);
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkStatus, 10000); // Check every 10 seconds
                } else {
                    this.showWarning('Workflow monitoring timeout. Please check GitHub Actions manually.');
                    this.setFormLoading(false);
                }
                
            } catch (error) {
                console.error('Error checking workflow status:', error);
                this.showError('Error monitoring workflow: ' + error.message);
                this.setFormLoading(false);
            }
        };
        
        checkStatus();
    }
    
    async fetchWorkflowArtifacts(runId, owner, repo) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Solana-Token-Creator'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch artifacts: ${response.status}`);
            }
            
            const artifactsData = await response.json();
            
            if (artifactsData.artifacts && artifactsData.artifacts.length > 0) {
                this.showRealTokenResult(artifactsData.artifacts[0], runId, owner, repo);
            } else {
                this.showError('No artifacts found. Token creation may have failed.');
            }
            
        } catch (error) {
            console.error('Error fetching artifacts:', error);
            this.showWarning('Token created but unable to fetch artifacts. Check GitHub Actions manually.');
        }
    }

    simulateWorkflowProgress() {
        const steps = [
            'Setting up Solana CLI...',
            'Installing dependencies...',
            'Creating token mint...',
            'Minting initial supply...',
            'Creating metadata...',
            'Saving artifacts...',
            'Token creation completed!'
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length - 1) {
                this.showStatus(steps[currentStep]);
                currentStep++;
            } else {
                clearInterval(interval);
                this.showSuccess(steps[currentStep]);
                this.setFormLoading(false);
                this.showTokenResult();
            }
        }, 2000);
    }

    showTokenResult() {
        // Generate a demo token address based on form inputs for variety
        const tokenName = document.getElementById('tokenName').value || 'DemoToken';
        const tokenSymbol = document.getElementById('tokenSymbol').value || 'DEMO';
        const demoAddress = this.generateDemoTokenAddress(tokenName + tokenSymbol);
        
        const resultHtml = `
            <div class="warning">
                <h4>⚠️ Demo Mode - Token NOT Actually Created</h4>
                <p>This is a demonstration. To create real tokens, you need to:</p>
                <ul>
                    <li>Set up GitHub repository secrets (SOLANA_PRIVATE_KEY, etc.)</li>
                    <li>Configure proper GitHub Actions workflow</li>
                    <li>Deploy with valid configuration</li>
                </ul>
            </div>
            <div class="success">
                <h4>📋 Demo Token Information</h4>
                <p><strong>Demo Token Address:</strong> <code>${demoAddress}</code></p>
                <p><strong>Token Name:</strong> ${tokenName}</p>
                <p><strong>Token Symbol:</strong> ${tokenSymbol}</p>
                <p><strong>Network:</strong> ${this.selectedNetwork}</p>
                <p><strong>Explorer:</strong> <a href="https://explorer.solana.com/address/${demoAddress}?cluster=${this.selectedNetwork}" target="_blank">View Demo on Solana Explorer</a></p>
                <p><strong>Artifacts:</strong> <a href="#" onclick="app.downloadArtifacts()">Download Demo Files</a></p>
            </div>
        `;
        
        document.getElementById('statusContent').innerHTML = resultHtml;
    }

    downloadArtifacts() {
        // In a real implementation, this would download the GitHub Actions artifacts
        alert('🚨 DEMO MODE: In a real implementation, this would download the token creation artifacts from GitHub Actions.\n\nTo enable real token creation:\n1. Set up GitHub repository secrets\n2. Configure GitHub Actions workflow\n3. Deploy with proper authentication');
    }
    
    async showRealTokenResult(artifact, runId, owner, repo) {
        const { tokenData } = this.currentWorkflowData || {};
        
        if (!tokenData) {
            this.showError('No token data available');
            return;
        }
        
        // Try to extract token address from artifact name or download artifact content
        let tokenAddress = 'Check artifacts for actual token address';
        let artifactDownloadUrl = null;
        
        // The artifact should contain token creation results
        if (artifact.name === 'token-creation-artifacts') {
            artifactDownloadUrl = artifact.archive_download_url;
        }
        
        const resultHtml = `
            <div class="success">
                <h4>✅ Real Token Created Successfully!</h4>
                <p>Your token has been successfully created on the Solana blockchain.</p>
            </div>
            <div class="success">
                <h4>📋 Token Information</h4>
                <p><strong>Token Address:</strong> <code>${tokenAddress}</code></p>
                <p><strong>Token Name:</strong> ${tokenData.name}</p>
                <p><strong>Token Symbol:</strong> ${tokenData.symbol}</p>
                <p><strong>Decimals:</strong> ${tokenData.decimals}</p>
                <p><strong>Supply:</strong> ${tokenData.supply}</p>
                <p><strong>Network:</strong> ${tokenData.network}</p>
                <p><strong>Workflow Run:</strong> <a href="https://github.com/${owner}/${repo}/actions/runs/${runId}" target="_blank">View on GitHub</a></p>
                <p><strong>Explorer:</strong> <a href="https://explorer.solana.com/address/${tokenAddress}?cluster=${tokenData.network}" target="_blank">View on Solana Explorer</a></p>
                ${artifactDownloadUrl ? `<p><strong>Artifacts:</strong> <a href="${artifactDownloadUrl}" target="_blank">Download Creation Artifacts</a></p>` : ''}
            </div>
        `;
        
        document.getElementById('statusContent').innerHTML = resultHtml;
    }
    
    generateDemoTokenAddress(seed) {
        // Generate a deterministic demo address based on input
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to a base58-like string (simplified)
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let result = '';
        let num = Math.abs(hash);
        
        for (let i = 0; i < 44; i++) {
            result = chars[num % chars.length] + result;
            num = Math.floor(num / chars.length);
            if (num === 0) num = Math.abs(hash) + i; // Add variety
        }
        
        return result;
    }

    setFormLoading(loading) {
        const submitBtn = document.getElementById('createTokenBtn');
        const formInputs = document.querySelectorAll('#tokenForm input, #tokenForm textarea, #tokenForm select');
        
        if (loading) {
            submitBtn.innerHTML = '<span class="loading"></span>Creating Token...';
            submitBtn.disabled = true;
            formInputs.forEach(input => input.disabled = true);
        } else {
            submitBtn.innerHTML = 'Create Token';
            submitBtn.disabled = false;
            formInputs.forEach(input => input.disabled = false);
        }
    }

    showStatus(message) {
        const statusSection = document.getElementById('statusSection');
        const statusContent = document.getElementById('statusContent');
        
        statusContent.innerHTML = `<div><span class="loading"></span>${message}</div>`;
        statusSection.classList.add('show');
    }

    showSuccess(message) {
        const statusSection = document.getElementById('statusSection');
        const statusContent = document.getElementById('statusContent');
        
        statusContent.innerHTML = `<div class="success">${message}</div>`;
        statusSection.classList.add('show');
    }

    showError(message) {
        const statusSection = document.getElementById('statusSection');
        const statusContent = document.getElementById('statusContent');
        
        statusContent.innerHTML = `<div class="error">${message}</div>`;
        statusSection.classList.add('show');
    }
    
    showWarning(message) {
        const statusSection = document.getElementById('statusSection');
        const statusContent = document.getElementById('statusContent');
        
        statusContent.innerHTML = `<div class="warning">${message}</div>`;
        statusSection.classList.add('show');
    }
}

// Initialize the app when the page loads
const app = new SolanaTokenCreator();

// Handle Phantom wallet events
if (window.solana) {
    window.solana.on('connect', () => {
        console.log('Wallet connected');
    });

    window.solana.on('disconnect', () => {
        console.log('Wallet disconnected');
        app.updateWalletStatus(false);
    });
}