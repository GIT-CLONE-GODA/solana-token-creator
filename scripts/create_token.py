#!/usr/bin/env python3
"""
Solana Token Creator Script

This script creates a new SPL token on Solana using the Solana CLI and Python.
It handles token creation, metadata setup, and initial minting.
"""

import argparse
import json
import subprocess
import sys
import os
import time
from datetime import datetime
from typing import Dict, Any, Optional


class SolanaTokenCreator:
    def __init__(self, wallet_path: str, network: str = 'devnet'):
        self.wallet_path = wallet_path
        self.network = network
        self.log_file = 'creation_log.txt'
        self.token_mint = None
        self.token_account = None
        
        # Initialize log file
        with open(self.log_file, 'w') as f:
            f.write(f"Token Creation Log - {datetime.now()}\n")
            f.write(f"Network: {network}\n")
            f.write("=" * 50 + "\n\n")
    
    def log(self, message: str, print_msg: bool = True):
        """Log message to file and optionally print to console"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        
        with open(self.log_file, 'a') as f:
            f.write(log_entry)
        
        if print_msg:
            print(message)
    
    def run_command(self, command: list, capture_output: bool = True) -> subprocess.CompletedProcess:
        """Run a shell command and log the result"""
        cmd_str = ' '.join(command)
        self.log(f"Executing: {cmd_str}")
        
        try:
            result = subprocess.run(
                command,
                capture_output=capture_output,
                text=True,
                check=True
            )
            
            if result.stdout:
                self.log(f"Output: {result.stdout.strip()}")
            
            return result
        except subprocess.CalledProcessError as e:
            error_msg = f"Command failed: {cmd_str}\nError: {e.stderr if e.stderr else str(e)}"
            self.log(error_msg)
            raise Exception(error_msg)
    
    def get_wallet_balance(self) -> float:
        """Get the current wallet balance"""
        try:
            result = self.run_command([
                'solana', 'balance', '--keypair', self.wallet_path
            ])
            balance_str = result.stdout.strip().split()[0]
            return float(balance_str)
        except Exception as e:
            self.log(f"Failed to get wallet balance: {e}")
            return 0.0
    
    def create_token_mint(self, decimals: int = 9) -> str:
        """Create a new token mint"""
        self.log("Creating token mint...")
        
        try:
            result = self.run_command([
                'spl-token', 'create-token',
                '--keypair', self.wallet_path,
                '--decimals', str(decimals)
            ])
            
            # Extract token mint address from output
            output_lines = result.stdout.strip().split('\n')
            for line in output_lines:
                if 'Creating token' in line:
                    self.token_mint = line.split()[-1]
                    break
            
            if not self.token_mint:
                raise Exception("Could not extract token mint address from output")
            
            self.log(f"Token mint created: {self.token_mint}")
            
            # Save token mint to file
            with open('token_mint.txt', 'w') as f:
                f.write(self.token_mint)
            
            return self.token_mint
        
        except Exception as e:
            self.log(f"Failed to create token mint: {e}")
            raise
    
    def create_token_account(self) -> str:
        """Create a token account for the mint"""
        self.log("Creating token account...")
        
        try:
            result = self.run_command([
                'spl-token', 'create-account',
                self.token_mint,
                '--keypair', self.wallet_path
            ])
            
            # Extract token account address from output
            output_lines = result.stdout.strip().split('\n')
            for line in output_lines:
                if 'Creating account' in line:
                    self.token_account = line.split()[-1]
                    break
            
            if not self.token_account:
                raise Exception("Could not extract token account address from output")
            
            self.log(f"Token account created: {self.token_account}")
            return self.token_account
        
        except Exception as e:
            self.log(f"Failed to create token account: {e}")
            raise
    
    def mint_tokens(self, amount: int) -> None:
        """Mint tokens to the token account"""
        self.log(f"Minting {amount} tokens...")
        
        try:
            self.run_command([
                'spl-token', 'mint',
                self.token_mint,
                str(amount),
                '--keypair', self.wallet_path
            ])
            
            self.log(f"Successfully minted {amount} tokens")
        
        except Exception as e:
            self.log(f"Failed to mint tokens: {e}")
            raise
    
    def create_metadata(self, name: str, symbol: str, description: str = "", image_url: str = "") -> Dict[str, Any]:
        """Create token metadata"""
        self.log("Creating token metadata...")
        
        metadata = {
            "name": name,
            "symbol": symbol,
            "description": description,
            "image": image_url,
            "mint": self.token_mint,
            "decimals": 9,  # This should be passed as parameter in real implementation
            "created_at": datetime.now().isoformat(),
            "network": self.network
        }
        
        # Save metadata to file
        with open('token_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        self.log(f"Metadata created and saved to token_metadata.json")
        return metadata
    
    def verify_token_creation(self) -> bool:
        """Verify that the token was created successfully"""
        self.log("Verifying token creation...")
        
        try:
            # Check token supply
            result = self.run_command([
                'spl-token', 'supply', self.token_mint
            ])
            
            supply = result.stdout.strip()
            self.log(f"Token supply: {supply}")
            
            # Check token account balance
            result = self.run_command([
                'spl-token', 'balance',
                '--address', self.token_account
            ])
            
            balance = result.stdout.strip()
            self.log(f"Token account balance: {balance}")
            
            return True
        
        except Exception as e:
            self.log(f"Token verification failed: {e}")
            return False
    
    def revoke_mint_authority(self) -> bool:
        """Revoke mint authority for the token"""
        if not self.token_mint:
            self.log("No token mint available for authority revocation")
            return False
        
        try:
            self.log("Revoking mint authority...")
            result = self.run_command([
                'spl-token', 'authorize',
                self.token_mint,
                'mint',
                '--disable'
            ])
            
            if result.returncode == 0:
                self.log("Mint authority revoked successfully")
                return True
            else:
                self.log(f"Failed to revoke mint authority: {result.stderr}")
                return False
                
        except Exception as e:
            self.log(f"Error revoking mint authority: {e}")
            return False
    
    def revoke_freeze_authority(self) -> bool:
        """Revoke freeze authority for the token"""
        if not self.token_mint:
            self.log("No token mint available for authority revocation")
            return False
        
        try:
            self.log("Revoking freeze authority...")
            result = self.run_command([
                'spl-token', 'authorize',
                self.token_mint,
                'freeze',
                '--disable'
            ])
            
            if result.returncode == 0:
                self.log("Freeze authority revoked successfully")
                return True
            else:
                self.log(f"Failed to revoke freeze authority: {result.stderr}")
                return False
                
        except Exception as e:
            self.log(f"Error revoking freeze authority: {e}")
            return False
    
    def create_token(
        self,
        name: str,
        symbol: str,
        description: str = "",
        supply: int = 1000000,
        decimals: int = 9,
        image_url: str = "",
        revoke_mint_authority: bool = False,
        revoke_freeze_authority: bool = False
    ) -> Dict[str, Any]:
        """Main method to create a complete token"""
        self.log(f"Starting token creation process for '{name}' ({symbol})")
        
        try:
            # Check wallet balance
            balance = self.get_wallet_balance()
            self.log(f"Wallet balance: {balance} SOL")
            
            if balance < 0.01:  # Minimum balance check
                raise Exception("Insufficient SOL balance for token creation")
            
            # Create token mint
            mint_address = self.create_token_mint(decimals)
            
            # Create token account
            account_address = self.create_token_account()
            
            # Mint initial supply
            self.mint_tokens(supply)
            
            # Create metadata
            metadata = self.create_metadata(name, symbol, description, image_url)
            
            # Verify creation
            if not self.verify_token_creation():
                raise Exception("Token verification failed")
            
            # Handle authority revocation if requested
            revocation_results = {}
            if revoke_mint_authority:
                revocation_results["mint_authority_revoked"] = self.revoke_mint_authority()
            
            if revoke_freeze_authority:
                revocation_results["freeze_authority_revoked"] = self.revoke_freeze_authority()
            
            result = {
                "success": True,
                "mint_address": mint_address,
                "token_account": account_address,
                "metadata": metadata,
                "network": self.network
            }
            
            # Add revocation results if any authorities were revoked
            if revocation_results:
                result["authority_revocation"] = revocation_results
            
            self.log("Token creation completed successfully!")
            return result
        
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "network": self.network
            }
            self.log(f"Token creation failed: {e}")
            return error_result


def main():
    parser = argparse.ArgumentParser(description='Create a Solana SPL token')
    parser.add_argument('--wallet-path', required=True, help='Path to wallet keypair file')
    parser.add_argument('--name', required=True, help='Token name')
    parser.add_argument('--symbol', required=True, help='Token symbol')
    parser.add_argument('--description', default='', help='Token description')
    parser.add_argument('--supply', type=int, default=1000000, help='Initial token supply')
    parser.add_argument('--decimals', type=int, default=9, help='Token decimals (0-9)')
    parser.add_argument('--image-url', default='', help='Token image URL')
    parser.add_argument('--revoke-mint-authority', action='store_true', help='Revoke mint authority after token creation')
    parser.add_argument('--revoke-freeze-authority', action='store_true', help='Revoke freeze authority after token creation')
    parser.add_argument('--network', choices=['devnet', 'mainnet'], default='devnet', help='Solana network')
    
    args = parser.parse_args()
    
    # Validate arguments
    if not os.path.exists(args.wallet_path):
        print(f"Error: Wallet file not found: {args.wallet_path}")
        sys.exit(1)
    
    if args.decimals < 0 or args.decimals > 9:
        print("Error: Decimals must be between 0 and 9")
        sys.exit(1)
    
    if args.supply <= 0:
        print("Error: Supply must be greater than 0")
        sys.exit(1)
    
    # Create token
    creator = SolanaTokenCreator(args.wallet_path, args.network)
    
    result = creator.create_token(
        name=args.name,
        symbol=args.symbol,
        description=args.description,
        supply=args.supply,
        decimals=args.decimals,
        image_url=args.image_url,
        revoke_mint_authority=args.revoke_mint_authority,
        revoke_freeze_authority=args.revoke_freeze_authority
    )
    
    # Output result
    if result['success']:
        print(f"\n✅ Token created successfully!")
        print(f"Mint Address: {result['mint_address']}")
        print(f"Token Account: {result['token_account']}")
        print(f"Network: {result['network']}")
        
        # Display authority revocation results if any
        if 'authority_revocation' in result:
            print("\n🔒 Authority Revocation Results:")
            revocation = result['authority_revocation']
            if 'mint_authority_revoked' in revocation:
                status = "✅ Success" if revocation['mint_authority_revoked'] else "❌ Failed"
                print(f"  Mint Authority: {status}")
            if 'freeze_authority_revoked' in revocation:
                status = "✅ Success" if revocation['freeze_authority_revoked'] else "❌ Failed"
                print(f"  Freeze Authority: {status}")
        
        if args.network == 'devnet':
            print(f"\nExplorer: https://explorer.solana.com/address/{result['mint_address']}?cluster=devnet")
        else:
            print(f"\nExplorer: https://explorer.solana.com/address/{result['mint_address']}")
    else:
        print(f"\n❌ Token creation failed: {result['error']}")
        sys.exit(1)


if __name__ == '__main__':
    main()