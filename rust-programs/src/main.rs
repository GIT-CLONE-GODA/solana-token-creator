use anyhow::{anyhow, Result};
use clap::{Arg, Command};
use log::{info, warn, error};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use spl_token::{
    instruction::{initialize_mint, mint_to, set_authority},
    state::{Account, Mint},
};
use std::{
    fs,
    str::FromStr,
};

/// Solana Token Operations CLI
/// 
/// This Rust program provides advanced token operations for Solana SPL tokens.
/// It can verify token creation, perform additional minting, and manage token accounts.

#[derive(Debug)]
struct TokenOperations {
    client: RpcClient,
    wallet: Keypair,
}

impl TokenOperations {
    fn new(rpc_url: &str, wallet_path: &str) -> Result<Self> {
        info!("Initializing Solana client with RPC URL: {}", rpc_url);
        let client = RpcClient::new_with_commitment(rpc_url.to_string(), CommitmentConfig::confirmed());
        
        info!("Loading wallet from: {}", wallet_path);
        let wallet_data = fs::read(wallet_path)
            .map_err(|e| anyhow!("Failed to read wallet file: {}", e))?;
        
        let wallet: Vec<u8> = serde_json::from_slice(&wallet_data)
            .map_err(|e| anyhow!("Failed to parse wallet JSON: {}", e))?;
        
        let wallet = Keypair::from_bytes(&wallet)
            .map_err(|e| anyhow!("Failed to create keypair from wallet data: {}", e))?;
        
        info!("Wallet loaded successfully: {}", wallet.pubkey());
        
        Ok(Self { client, wallet })
    }
    
    fn verify_token(&self, mint_address: &str) -> Result<()> {
        info!("Verifying token mint: {}", mint_address);
        
        let mint_pubkey = Pubkey::from_str(mint_address)
            .map_err(|e| anyhow!("Invalid mint address: {}", e))?;
        
        // Get mint account info
        let mint_account = self.client.get_account(&mint_pubkey)
            .map_err(|e| anyhow!("Failed to get mint account: {}", e))?;
        
        // Verify it's a valid mint account
        if mint_account.owner != spl_token::id() {
            return Err(anyhow!("Account is not owned by SPL Token program"));
        }
        
        // Parse mint data
        let mint_data = Mint::unpack(&mint_account.data)
            .map_err(|e| anyhow!("Failed to parse mint data: {}", e))?;
        
        info!("Token verification successful!");
        info!("  Mint Authority: {:?}", mint_data.mint_authority);
        info!("  Supply: {}", mint_data.supply);
        info!("  Decimals: {}", mint_data.decimals);
        info!("  Is Initialized: {}", mint_data.is_initialized);
        info!("  Freeze Authority: {:?}", mint_data.freeze_authority);
        
        Ok(())
    }
    
    fn get_token_balance(&self, mint_address: &str, owner: Option<&str>) -> Result<()> {
        let mint_pubkey = Pubkey::from_str(mint_address)
            .map_err(|e| anyhow!("Invalid mint address: {}", e))?;
        
        let owner_pubkey = if let Some(owner_str) = owner {
            Pubkey::from_str(owner_str)
                .map_err(|e| anyhow!("Invalid owner address: {}", e))?
        } else {
            self.wallet.pubkey()
        };
        
        info!("Getting token balance for owner: {}", owner_pubkey);
        
        // Get associated token account
        let associated_token_account = spl_associated_token_account::get_associated_token_address(
            &owner_pubkey,
            &mint_pubkey,
        );
        
        info!("Associated token account: {}", associated_token_account);
        
        match self.client.get_account(&associated_token_account) {
            Ok(account) => {
                let token_account = Account::unpack(&account.data)
                    .map_err(|e| anyhow!("Failed to parse token account: {}", e))?;
                
                info!("Token balance: {}", token_account.amount);
                info!("Account owner: {}", token_account.owner);
                info!("Mint: {}", token_account.mint);
            }
            Err(_) => {
                warn!("No associated token account found for this mint and owner");
            }
        }
        
        Ok(())
    }
    
    fn get_wallet_balance(&self) -> Result<()> {
        let balance = self.client.get_balance(&self.wallet.pubkey())
            .map_err(|e| anyhow!("Failed to get wallet balance: {}", e))?;
        
        let sol_balance = balance as f64 / 1_000_000_000.0; // Convert lamports to SOL
        info!("Wallet SOL balance: {} SOL ({} lamports)", sol_balance, balance);
        
        Ok(())
    }
    
    fn list_token_accounts(&self) -> Result<()> {
        info!("Listing all token accounts for wallet: {}", self.wallet.pubkey());
        
        let token_accounts = self.client.get_token_accounts_by_owner(
            &self.wallet.pubkey(),
            solana_client::rpc_request::TokenAccountsFilter::ProgramId(spl_token::id()),
        ).map_err(|e| anyhow!("Failed to get token accounts: {}", e))?;
        
        if token_accounts.is_empty() {
            info!("No token accounts found");
            return Ok(());
        }
        
        info!("Found {} token account(s):", token_accounts.len());
        
        for (i, account) in token_accounts.iter().enumerate() {
            let account_pubkey = Pubkey::from_str(&account.pubkey)
                .map_err(|e| anyhow!("Invalid account pubkey: {}", e))?;
            
            if let Ok(account_data) = self.client.get_account(&account_pubkey) {
                if let Ok(token_account) = Account::unpack(&account_data.data) {
                    info!("  {}. Account: {}", i + 1, account.pubkey);
                    info!("     Mint: {}", token_account.mint);
                    info!("     Balance: {}", token_account.amount);
                    info!("     Owner: {}", token_account.owner);
                    info!("");
                }
            }
        }
        
        Ok(())
    }
    
    fn revoke_mint_authority(&self, mint_address: &str) -> Result<()> {
        info!("Revoking mint authority for token: {}", mint_address);
        
        let mint_pubkey = Pubkey::from_str(mint_address)
            .map_err(|e| anyhow!("Invalid mint address: {}", e))?;
        
        // Create instruction to disable mint authority
        let instruction = set_authority(
            &spl_token::id(),
            &mint_pubkey,
            None, // Set authority to None (disable)
            spl_token::instruction::AuthorityType::MintTokens,
            &self.wallet.pubkey(),
            &[&self.wallet.pubkey()],
        )?;
        
        let recent_blockhash = self.client.get_latest_blockhash()?;
        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.wallet.pubkey()),
            &[&self.wallet],
            recent_blockhash,
        );
        
        match self.client.send_and_confirm_transaction(&transaction) {
            Ok(signature) => {
                info!("Mint authority revoked successfully! Signature: {}", signature);
                Ok(())
            }
            Err(e) => {
                error!("Failed to revoke mint authority: {}", e);
                Err(anyhow!("Failed to revoke mint authority: {}", e))
            }
        }
    }
    
    fn revoke_freeze_authority(&self, mint_address: &str) -> Result<()> {
        info!("Revoking freeze authority for token: {}", mint_address);
        
        let mint_pubkey = Pubkey::from_str(mint_address)
            .map_err(|e| anyhow!("Invalid mint address: {}", e))?;
        
        // Create instruction to disable freeze authority
        let instruction = set_authority(
            &spl_token::id(),
            &mint_pubkey,
            None, // Set authority to None (disable)
            spl_token::instruction::AuthorityType::FreezeAccount,
            &self.wallet.pubkey(),
            &[&self.wallet.pubkey()],
        )?;
        
        let recent_blockhash = self.client.get_latest_blockhash()?;
        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.wallet.pubkey()),
            &[&self.wallet],
            recent_blockhash,
        );
        
        match self.client.send_and_confirm_transaction(&transaction) {
            Ok(signature) => {
                info!("Freeze authority revoked successfully! Signature: {}", signature);
                Ok(())
            }
            Err(e) => {
                error!("Failed to revoke freeze authority: {}", e);
                Err(anyhow!("Failed to revoke freeze authority: {}", e))
            }
        }
    }
    
    fn analyze_token(&self, mint_address: &str) -> Result<()> {
        info!("Performing comprehensive token analysis for: {}", mint_address);
        
        // Verify token
        self.verify_token(mint_address)?;
        
        // Get token balance for wallet
        self.get_token_balance(mint_address, None)?;
        
        // Get wallet SOL balance
        self.get_wallet_balance()?;
        
        info!("Token analysis completed successfully!");
        Ok(())
    }
}

fn main() -> Result<()> {
    env_logger::init();
    
    let matches = Command::new("Solana Token Operations")
        .version("1.0")
        .author("Solana Token Creator")
        .about("Advanced operations for Solana SPL tokens")
        .arg(
            Arg::new("wallet-path")
                .long("wallet-path")
                .value_name("FILE")
                .help("Path to wallet keypair file")
                .required(true),
        )
        .arg(
            Arg::new("mint-address")
                .long("mint-address")
                .value_name("ADDRESS")
                .help("Token mint address")
                .required(true),
        )
        .arg(
            Arg::new("operation")
                .long("operation")
                .value_name("OP")
                .help("Operation to perform")
                .value_parser(["verify", "balance", "analyze", "list-accounts", "revoke-mint-authority", "revoke-freeze-authority"])
                .default_value("verify"),
        )
        .arg(
            Arg::new("rpc-url")
                .long("rpc-url")
                .value_name("URL")
                .help("Solana RPC URL")
                .default_value("https://api.devnet.solana.com"),
        )
        .arg(
            Arg::new("owner")
                .long("owner")
                .value_name("ADDRESS")
                .help("Token account owner (for balance operation)"),
        )
        .get_matches();
    
    let wallet_path = matches.get_one::<String>("wallet-path").unwrap();
    let mint_address = matches.get_one::<String>("mint-address").unwrap();
    let operation = matches.get_one::<String>("operation").unwrap();
    let rpc_url = matches.get_one::<String>("rpc-url").unwrap();
    let owner = matches.get_one::<String>("owner");
    
    info!("Starting Solana Token Operations");
    info!("Wallet: {}", wallet_path);
    info!("Mint: {}", mint_address);
    info!("Operation: {}", operation);
    info!("RPC URL: {}", rpc_url);
    
    let token_ops = TokenOperations::new(rpc_url, wallet_path)?;
    
    match operation.as_str() {
        "verify" => {
            info!("Performing token verification...");
            token_ops.verify_token(mint_address)?
        }
        "balance" => {
            info!("Getting token balance...");
            token_ops.get_token_balance(mint_address, owner.map(|s| s.as_str()))?
        }
        "analyze" => {
            info!("Performing comprehensive token analysis...");
            token_ops.analyze_token(mint_address)?
        }
        "list-accounts" => {
            info!("Listing all token accounts...");
            token_ops.list_token_accounts()?
        }
        "revoke-mint-authority" => {
            info!("Revoking mint authority...");
            token_ops.revoke_mint_authority(mint_address)?
        }
        "revoke-freeze-authority" => {
            info!("Revoking freeze authority...");
            token_ops.revoke_freeze_authority(mint_address)?
        }
        _ => {
            error!("Unknown operation: {}", operation);
            return Err(anyhow!("Invalid operation"));
        }
    }
    
    info!("Operation completed successfully!");
    Ok(())
}