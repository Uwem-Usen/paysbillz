const axios = require('axios');

class StroWalletService {
    constructor() {
        this.publicKey = process.env.STROWALLET_PUBLIC_KEY;
        this.secretKey = process.env.STROWALLET_SECRET_KEY;
        this.baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://strowallet.com/api/' 
            : 'https://strowallet.com/api/'; // Use sandbox if available
    }

    // ============ GET BANKS LIST ============
    async getBanks() {
        try {
            const response = await axios.get(`${this.baseURL}/banks/`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.publicKey}`
                }
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('❌ StroWallet getBanks error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch banks'
            };
        }
    }

    // ============ GET ACCOUNT NAME (Verify Account) ============
    async getAccountName(bankCode, accountNumber) {
        try {
            const response = await axios.get(`${this.baseURL}/banks/get-customer-name/`, {
                params: {
                    public_key: this.publicKey,
                    bank_code: bankCode,
                    account_number: accountNumber
                },
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('❌ StroWallet getAccountName error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to verify account'
            };
        }
    }

    // ============ TRANSFER TO BANK ACCOUNT ============
    async bankTransfer(amount, bankCode, accountNumber, narration, nameEnquiryRef) {
        try {
            const response = await axios.post(
                `${this.baseURL}/transfer/`,
                {
                    amount: amount.toString(),
                    bank_code: bankCode,
                    account_number: accountNumber,
                    narration: narration || 'Transfer from Paysbillz',
                    name_enquiry_ref: nameEnquiryRef || `REF_${Date.now()}`,
                    public_key: this.publicKey
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('❌ StroWallet bankTransfer error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Transfer failed'
            };
        }
    }

    // ============ CHECK TRANSACTION STATUS ============
    async checkStatus(reference) {
        try {
            const response = await axios.get(`${this.baseURL}/checkout/status/`, {
                params: {
                    public_key: this.publicKey,
                    reference: reference
                },
                headers: {
                    'Accept': 'application/json'
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('❌ StroWallet checkStatus error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to check status'
            };
        }
    }

    // ============ WALLET TO WALLET TRANSFER ============
    async walletTransfer(amount, currency, receiver, note) {
        try {
            const response = await axios.post(
                `${this.baseURL}/users/transfer/`,
                {
                    amount: amount.toString(),
                    currency: currency || 'NGN',
                    receiver: receiver,
                    note: note || 'Transfer from Paysbillz'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.publicKey}`
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('❌ StroWallet walletTransfer error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Wallet transfer failed'
            };
        }
    }
}

module.exports = new StroWalletService();