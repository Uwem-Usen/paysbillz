// services/monnify.js
const axios = require('axios');
require('dotenv').config();

class MonnifyService {
  constructor() {
    this.apiKey = process.env.MONNIFY_API_KEY;
    this.secretKey = process.env.MONNIFY_SECRET_KEY;
    this.contractCode = process.env.MONNIFY_CONTRACT_CODE;
    this.baseURL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    if (this.token && this.tokenExpiry > Date.now()) {
      return this.token;
    }

    const auth = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');
    const response = await axios.post(
      `${this.baseURL}/api/v1/auth/login`,
      {},
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    this.token = response.data.responseBody.accessToken;
    this.tokenExpiry = Date.now() + 3600000; // 1 hour
    return this.token;
  }

  async createVirtualAccount(userId, customerName, customerEmail) {
    const token = await this.getToken();
    
    const reference = `PAY-${userId}-${Date.now()}`;
    
    const response = await axios.post(
      `${this.baseURL}/api/v1/bank-transfer/reserved-accounts`,
      {
        accountReference: reference,
        accountName: `Paysbillz-${customerName}`,
        currencyCode: 'NGN',
        contractCode: this.contractCode,
        customerName: customerName,
        customerEmail: customerEmail,
        getAllAvailableBanks: true
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.responseBody;
  }

  async getTransactions(accountReference) {
    const token = await this.getToken();
    
    const response = await axios.get(
      `${this.baseURL}/api/v1/bank-transfer/transactions?accountReference=${accountReference}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.responseBody;
  }
}

module.exports = new MonnifyService();