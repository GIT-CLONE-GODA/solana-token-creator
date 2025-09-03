#!/usr/bin/env python3
"""
Solana Token Report Generator

This script generates a comprehensive HTML report for a created Solana token.
"""

import argparse
import json
import subprocess
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional


class TokenReportGenerator:
    def __init__(self, mint_address: str, network: str = 'devnet'):
        self.mint_address = mint_address
        self.network = network
        self.report_data = {}
    
    def run_command(self, command: list) -> subprocess.CompletedProcess:
        """Run a shell command and return the result"""
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=True
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"Command failed: {' '.join(command)}")
            print(f"Error: {e.stderr if e.stderr else str(e)}")
            return None
    
    def get_token_info(self) -> Dict[str, Any]:
        """Get token information from Solana CLI"""
        try:
            # Get token supply
            result = self.run_command(['spl-token', 'supply', self.mint_address])
            supply = result.stdout.strip() if result else "Unknown"
            
            # Get token account info (if available)
            result = self.run_command(['solana', 'account', self.mint_address, '--output', 'json'])
            account_info = json.loads(result.stdout) if result else {}
            
            return {
                'supply': supply,
                'account_info': account_info
            }
        except Exception as e:
            print(f"Error getting token info: {e}")
            return {'supply': 'Unknown', 'account_info': {}}
    
    def load_metadata(self) -> Dict[str, Any]:
        """Load token metadata from file if available"""
        try:
            if os.path.exists('token_metadata.json'):
                with open('token_metadata.json', 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading metadata: {e}")
        
        return {}
    
    def load_creation_log(self) -> str:
        """Load creation log if available"""
        try:
            if os.path.exists('creation_log.txt'):
                with open('creation_log.txt', 'r') as f:
                    return f.read()
        except Exception as e:
            print(f"Error loading creation log: {e}")
        
        return "Creation log not available"
    
    def generate_html_report(self, wallet_address: str = "") -> str:
        """Generate HTML report"""
        token_info = self.get_token_info()
        metadata = self.load_metadata()
        creation_log = self.load_creation_log()
        
        # Determine explorer URL
        if self.network == 'mainnet':
            explorer_url = f"https://explorer.solana.com/address/{self.mint_address}"
        else:
            explorer_url = f"https://explorer.solana.com/address/{self.mint_address}?cluster=devnet"
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Creation Report - {metadata.get('name', 'Unknown Token')}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        
        .header h1 {{
            margin: 0;
            font-size: 2.5rem;
        }}
        
        .header p {{
            margin: 10px 0 0 0;
            font-size: 1.2rem;
            opacity: 0.9;
        }}
        
        .content {{
            padding: 40px;
        }}
        
        .section {{
            margin-bottom: 40px;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }}
        
        .section h2 {{
            margin-top: 0;
            color: #333;
            font-size: 1.8rem;
        }}
        
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }}
        
        .info-item {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }}
        
        .info-item h3 {{
            margin-top: 0;
            color: #667eea;
            font-size: 1.2rem;
        }}
        
        .info-item p {{
            margin: 10px 0;
            word-break: break-all;
        }}
        
        .address {{
            font-family: 'Courier New', monospace;
            background: #f1f3f4;
            padding: 10px;
            border-radius: 5px;
            font-size: 0.9rem;
        }}
        
        .btn {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            transition: transform 0.2s;
        }}
        
        .btn:hover {{
            transform: translateY(-2px);
        }}
        
        .status-success {{
            color: #28a745;
            font-weight: 600;
        }}
        
        .log-container {{
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
        }}
        
        .timestamp {{
            color: #a0aec0;
            font-size: 0.9rem;
        }}
        
        @media (max-width: 768px) {{
            .container {{
                margin: 10px;
                border-radius: 10px;
            }}
            
            .header, .content {{
                padding: 20px;
            }}
            
            .header h1 {{
                font-size: 2rem;
            }}
            
            .info-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🪙 {metadata.get('name', 'Token Creation Report')}</h1>
            <p>Solana Token Creation Report</p>
            <p class="timestamp">Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Token Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <h3>Token Details</h3>
                        <p><strong>Name:</strong> {metadata.get('name', 'N/A')}</p>
                        <p><strong>Symbol:</strong> {metadata.get('symbol', 'N/A')}</p>
                        <p><strong>Description:</strong> {metadata.get('description', 'N/A')}</p>
                        <p><strong>Decimals:</strong> {metadata.get('decimals', 'N/A')}</p>
                    </div>
                    
                    <div class="info-item">
                        <h3>Network Information</h3>
                        <p><strong>Network:</strong> {self.network.title()}</p>
                        <p><strong>Status:</strong> <span class="status-success">✅ Created Successfully</span></p>
                        <p><strong>Supply:</strong> {token_info.get('supply', 'Unknown')}</p>
                        <p><strong>Created:</strong> {metadata.get('created_at', 'N/A')}</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔗 Addresses & Links</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <h3>Token Mint Address</h3>
                        <div class="address">{self.mint_address}</div>
                        <p style="margin-top: 15px;">
                            <a href="{explorer_url}" target="_blank" class="btn">View on Solana Explorer</a>
                        </p>
                    </div>
                    
                    {f'''
                    <div class="info-item">
                        <h3>Creator Wallet</h3>
                        <div class="address">{wallet_address}</div>
                    </div>
                    ''' if wallet_address else ''}
                </div>
            </div>
            
            {f'''
            <div class="section">
                <h2>🖼️ Token Image</h2>
                <div class="info-item">
                    <img src="{metadata.get('image', '')}" alt="Token Image" style="max-width: 200px; border-radius: 10px;" onerror="this.style.display='none'">
                    <p><strong>Image URL:</strong> {metadata.get('image', 'N/A')}</p>
                </div>
            </div>
            ''' if metadata.get('image') else ''}
            
            <div class="section">
                <h2>📝 Creation Log</h2>
                <div class="log-container">{creation_log}</div>
            </div>
            
            <div class="section">
                <h2>📋 Raw Metadata</h2>
                <div class="log-container">{json.dumps(metadata, indent=2)}</div>
            </div>
        </div>
    </div>
</body>
</html>
        """
        
        return html_content
    
    def save_report(self, wallet_address: str = "") -> str:
        """Generate and save HTML report"""
        html_content = self.generate_html_report(wallet_address)
        
        report_filename = 'token_report.html'
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Report generated: {report_filename}")
        return report_filename


def main():
    parser = argparse.ArgumentParser(description='Generate Solana token creation report')
    parser.add_argument('--mint-address', required=True, help='Token mint address')
    parser.add_argument('--network', choices=['devnet', 'mainnet'], default='devnet', help='Solana network')
    parser.add_argument('--wallet-address', default='', help='Creator wallet address')
    
    args = parser.parse_args()
    
    # Generate report
    generator = TokenReportGenerator(args.mint_address, args.network)
    report_file = generator.save_report(args.wallet_address)
    
    print(f"\n✅ Token report generated successfully!")
    print(f"Report file: {report_file}")
    print(f"Open the file in a web browser to view the report.")


if __name__ == '__main__':
    main()