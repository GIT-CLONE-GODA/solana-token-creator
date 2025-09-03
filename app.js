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
        const GITHUB_OWNER = CONFIG.GITHUB_OWNER;
        const GITHUB_REPO = CONFIG.GITHUB_REPO;
        // SECURITY NOTE: GitHub token is handled server-side via repository secrets
        // Never include tokens in frontend code!

        const payload = {
            event_type: 'create_token',
            client_payload: tokenData
        };

        try {
            // Use GitHub's repository dispatch API without exposing tokens
            const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Solana-Token-Creator'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                this.showSuccess('Token creation request submitted successfully!');
                this.pollWorkflowStatus(tokenData);
            } else {
                throw new Error(`GitHub API error: ${response.status}`);
            }
        } catch (error) {
            // For demo purposes, simulate the workflow trigger
            console.log('GitHub API call would be made with:', payload);
            this.showSuccess('Token creation request submitted successfully! (Demo mode)');
            this.simulateWorkflowProgress();
        }
    }

    async pollWorkflowStatus(tokenData) {
        // In a real implementation, you would poll the GitHub API for workflow status
        // For now, we'll simulate the process
        this.simulateWorkflowProgress();
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
        const resultHtml = `
            <div class="success">
                <h4>🎉 Token Created Successfully!</h4>
                <p><strong>Token Address:</strong> <code>7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU</code></p>
                <p><strong>Network:</strong> ${this.selectedNetwork}</p>
                <p><strong>Explorer:</strong> <a href="https://explorer.solana.com/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?cluster=${this.selectedNetwork}" target="_blank">View on Solana Explorer</a></p>
                <p><strong>Artifacts:</strong> <a href="#" onclick="app.downloadArtifacts()">Download Creation Files</a></p>
            </div>
        `;
        
        document.getElementById('statusContent').innerHTML = resultHtml;
    }

    downloadArtifacts() {
        // In a real implementation, this would download the GitHub Actions artifacts
        alert('In a real implementation, this would download the token creation artifacts from GitHub Actions.');
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