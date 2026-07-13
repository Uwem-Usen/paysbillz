// services/flutterwave.js
const axios = require('axios');

class FlutterwaveService {
    constructor() {
        this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || 'your_flutterwave_secret_key_here';
        this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || 'your_flutterwave_public_key_here';
        this.isSandbox = process.env.FLUTTERWAVE_ENVIRONMENT !== 'live';
        this.baseUrl = this.isSandbox 
            ? 'https://api.flutterwave.com/v3/' 
            : 'https://api.flutterwave.com/v3/';
        this.headers = {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
        };
        console.log('💳 Flutterwave initialized:');
        console.log(`   Environment: ${this.isSandbox ? 'SANDBOX' : 'LIVE'}`);
        console.log(`   API Key: ${this.secretKey ? '✅ Set' : '❌ Missing'}`);
    }

    // Initialize Payment
    async initializePayment(data) {
        try {
            const payload = {
                tx_ref: data.tx_ref || this.generateReference(),
                amount: data.amount,
                currency: data.currency || 'NGN',
                redirect_url: data.redirect_url || process.env.FLUTTERWAVE_CALLBACK_URL || 'http://localhost:3000/payment/status',
                customer: {
                    email: data.customer.email,
                    name: data.customer.name || 'Customer',
                    phonenumber: data.customer.phone || ''
                },
                customizations: {
                    title: data.customizations?.title || 'Paysbillz Payment',
                    description: data.customizations?.description || 'Payment for services',
                    logo: data.customizations?.logo || 'https://paysbillz.com/logo.png'
                },
                meta: data.meta || {}
            };

            const response = await axios.post(
                `${this.baseUrl}payments`,
                payload,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Verify Payment
    async verifyPayment(transactionId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}transactions/${transactionId}/verify`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Get Banks
    async getBanks(country = 'NG') {
        try {
            const response = await axios.get(
                `${this.baseUrl}banks/${country}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Verify Bank Account
    async verifyBankAccount(bankCode, accountNumber) {
        try {
            const response = await axios.post(
                `${this.baseUrl}accounts/resolve`,
                {
                    account_number: accountNumber,
                    account_bank: bankCode
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Create Transfer (Withdraw to Bank)
    async createTransfer(data) {
        try {
            const payload = {
                account_bank: data.bankCode,
                account_number: data.accountNumber,
                amount: data.amount,
                narration: data.narration || 'Paysbillz Withdrawal',
                currency: data.currency || 'NGN',
                reference: data.reference || this.generateReference(),
                beneficiary_name: data.beneficiaryName || ''
            };

            const response = await axios.post(
                `${this.baseUrl}transfers`,
                payload,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Generate Reference
    generateReference() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `PAY-${timestamp}-${random}`.toUpperCase();
    }

    handleError(error) {
        console.error('Flutterwave API Error:', error.message);
        if (error.response) {
            return {
                status: 'error',
                code: error.response.status,
                message: error.response.data?.message || 'Flutterwave API Error',
                details: error.response.data || null
            };
        } else if (error.request) {
            return {
                status: 'error',
                code: 503,
                message: 'No response from Flutterwave server',
                details: null
            };
        } else {
            return {
                status: 'error',
                code: 500,
                message: error.message || 'Unknown error occurred',
                details: null
            };
        }
    }
}

module.exports = new FlutterwaveService();
