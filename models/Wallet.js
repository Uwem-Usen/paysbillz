const { query } = require('../config/database');

class Wallet {
  // Get user's wallet balance
  static async getBalance(userId) {
    const result = await query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.balance || 0;
  }

  // Add money to wallet
  static async credit(userId, amount, description, reference) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get current balance
      const balanceResult = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      
      const currentBalance = parseFloat(balanceResult.rows[0]?.balance || 0);
      const newBalance = currentBalance + amount;
      
      // Update wallet
      await client.query(
        'UPDATE wallets SET balance = $1, last_updated = CURRENT_TIMESTAMP WHERE user_id = $2',
        [newBalance, userId]
      );
      
      // Record transaction
      await client.query(
        `INSERT INTO transactions (user_id, type, category, amount, balance_before, balance_after, reference, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, 'credit', 'wallet_funding', amount, currentBalance, newBalance, reference, 'completed']
      );
      
      await client.query('COMMIT');
      return { success: true, balance: newBalance };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Deduct money from wallet
  static async debit(userId, amount, description, reference) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get current balance
      const balanceResult = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      
      const currentBalance = parseFloat(balanceResult.rows[0]?.balance || 0);
      
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }
      
      const newBalance = currentBalance - amount;
      
      // Update wallet
      await client.query(
        'UPDATE wallets SET balance = $1, last_updated = CURRENT_TIMESTAMP WHERE user_id = $2',
        [newBalance, userId]
      );
      
      // Record transaction
      await client.query(
        `INSERT INTO transactions (user_id, type, category, amount, balance_before, balance_after, reference, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, 'debit', description, amount, currentBalance, newBalance, reference, 'completed']
      );
      
      await client.query('COMMIT');
      return { success: true, balance: newBalance };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Wallet;