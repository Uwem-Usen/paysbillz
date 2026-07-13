// services/betting.js
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
});

const bettingPlatforms = {
  bet9ja: { 
    id: 'bet9ja', 
    name: 'Bet9ja', 
    commission: 0.003, 
    minDeposit: 100,
    maxDeposit: 1000000,
    logo: 'https://www.bet9ja.com/favicon.ico',
    description: 'Nigeria\'s leading sports betting platform'
  },
  sportybet: { 
    id: 'sportybet', 
    name: 'Sportybet', 
    commission: 0.005, 
    maxCommission: 800,
    minDeposit: 100,
    maxDeposit: 500000,
    logo: 'https://www.sportybet.com/favicon.ico',
    description: 'Fast and reliable betting platform'
  },
  nairabet: { 
    id: 'nairabet', 
    name: 'Nairabet', 
    commission: 0.002,
    minDeposit: 100,
    maxDeposit: 500000,
    logo: 'https://www.nairabet.com/favicon.ico',
    description: 'Nigerian owned betting platform'
  },
  merrybet: { 
    id: 'merrybet', 
    name: 'Merrybet Gold', 
    commission: 0.001,
    minDeposit: 100,
    maxDeposit: 300000,
    logo: 'https://www.merrybet.com/favicon.ico',
    description: 'Gold standard betting experience'
  },
  '1xbet': { 
    id: '1xbet', 
    name: '1Xbet', 
    commission: 0.002,
    minDeposit: 100,
    maxDeposit: 1000000,
    logo: 'https://www.1xbet.com/favicon.ico',
    description: 'International betting platform'
  }
};

class BettingService {
  // Get all available platforms
  getPlatforms() {
    return Object.values(bettingPlatforms);
  }

  // Get platform by ID
  getPlatform(platformId) {
    return bettingPlatforms[platformId];
  }

  // Calculate commission
  calculateCommission(platformId, amount) {
    const platform = this.getPlatform(platformId);
    if (!platform) return 0;

    let commission = amount * platform.commission;
    
    // Cap commission for Sportybet
    if (platform.maxCommission && commission > platform.maxCommission) {
      commission = platform.maxCommission;
    }

    return Math.round(commission * 100) / 100;
  }

  // Process deposit to betting platform
  async depositToBetting(userId, platformId, amount) {
    try {
      const platform = this.getPlatform(platformId);
      if (!platform) {
        throw new Error('Platform not found');
      }

      if (amount < platform.minDeposit) {
        throw new Error(`Minimum deposit is ₦${platform.minDeposit}`);
      }

      if (amount > platform.maxDeposit) {
        throw new Error(`Maximum deposit is ₦${platform.maxDeposit}`);
      }

      // Check user's wallet balance
      const walletResult = await pool.query(
        'SELECT id, balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      if (walletResult.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      const wallet = walletResult.rows[0];
      const balance = parseFloat(wallet.balance);

      if (balance < amount) {
        throw new Error(`Insufficient balance. You have ₦${balance}`);
      }

      // Calculate commission
      const commission = this.calculateCommission(platformId, amount);
      const netAmount = amount - commission;

      // Deduct from wallet
      await pool.query(
        'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
        [amount, wallet.id]
      );

      // Generate reference
      const reference = 'BET-' + platformId.toUpperCase() + '-' + Date.now().toString(36).toUpperCase();

      // Record deposit transaction
      await pool.query(
        `INSERT INTO transactions (user_id, wallet_id, type, amount, description, reference, status, service_type, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, wallet.id, 'betting_deposit', amount,
         `Deposit to ${platform.name}`,
         reference, 'success', 'betting',
         JSON.stringify({ platform: platformId, commission, netAmount })]
      );

      // Record commission transaction
      if (commission > 0) {
        await pool.query(
          `INSERT INTO transactions (user_id, wallet_id, type, amount, description, reference, status, service_type, metadata) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [userId, wallet.id, 'commission', commission,
           `Commission for ${platform.name} deposit`,
           'COMM-' + Date.now().toString(36).toUpperCase(),
           'success', 'commission',
           JSON.stringify({ platform: platformId, source: 'betting_deposit' })]
        );
      }

      // Get updated balance
      const updatedWallet = await pool.query(
        'SELECT balance FROM wallets WHERE id = $1',
        [wallet.id]
      );

      return {
        success: true,
        message: `Successfully deposited ₦${amount} to ${platform.name}`,
        data: {
          reference,
          platform: platformId,
          amount,
          commission,
          netAmount,
          newBalance: parseFloat(updatedWallet.rows[0].balance)
        }
      };
    } catch (error) {
      console.error('❌ Betting deposit error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Withdraw winnings from betting platform
  async withdrawFromBetting(userId, platformId, amount) {
    try {
      const platform = this.getPlatform(platformId);
      if (!platform) {
        throw new Error('Platform not found');
      }

      // Get user's wallet
      const walletResult = await pool.query(
        'SELECT id, balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      if (walletResult.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      const wallet = walletResult.rows[0];

      // Generate reference
      const reference = 'BET-WD-' + platformId.toUpperCase() + '-' + Date.now().toString(36).toUpperCase();

      // Add to wallet
      await pool.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [amount, wallet.id]
      );

      // Record withdrawal transaction
      await pool.query(
        `INSERT INTO transactions (user_id, wallet_id, type, amount, description, reference, status, service_type, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, wallet.id, 'betting_withdrawal', amount,
         `Withdrawal from ${platform.name}`,
         reference, 'success', 'betting',
         JSON.stringify({ platform: platformId })]
      );

      // Get updated balance
      const updatedWallet = await pool.query(
        'SELECT balance FROM wallets WHERE id = $1',
        [wallet.id]
      );

      return {
        success: true,
        message: `Successfully withdrew ₦${amount} from ${platform.name}`,
        data: {
          reference,
          platform: platformId,
          amount,
          newBalance: parseFloat(updatedWallet.rows[0].balance)
        }
      };
    } catch (error) {
      console.error('❌ Betting withdrawal error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get betting statistics
  async getBettingStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_betting_transactions,
          SUM(CASE WHEN type = 'betting_deposit' THEN amount ELSE 0 END) as total_deposited,
          SUM(CASE WHEN type = 'betting_withdrawal' THEN amount ELSE 0 END) as total_withdrawn,
          SUM(CASE WHEN type = 'commission' THEN amount ELSE 0 END) as total_commission
         FROM transactions 
         WHERE user_id = $1 AND service_type = 'betting'`,
        [userId]
      );

      return {
        success: true,
        data: {
          totalTransactions: parseInt(result.rows[0].total_betting_transactions) || 0,
          totalDeposited: parseFloat(result.rows[0].total_deposited) || 0,
          totalWithdrawn: parseFloat(result.rows[0].total_withdrawn) || 0,
          totalCommission: parseFloat(result.rows[0].total_commission) || 0
        }
      };
    } catch (error) {
      console.error('❌ Betting stats error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new BettingService();