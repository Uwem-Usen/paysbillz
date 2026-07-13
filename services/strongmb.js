// services/strongmb.js
const axios = require('axios');
require('dotenv').config();

class StrongmbService {
    constructor() {
        // Read from environment variables
        this.apiKey = process.env.STRONGMB_API_KEY;
        this.publicKey = process.env.STRONGMB_PUBLIC_KEY;
        this.webhookKey = process.env.STRONGMB_WEBHOOK_KEY;
        this.baseURL = process.env.STRONGMB_BASE_URL || 'https://api.strongmb.com/v1';
        
        this.enabled = true;
        this.token = null;
        this.tokenExpiry = null;
        
        console.log('📡 Strongmb Service:');
        console.log(`   - Status: ${this.apiKey ? '✅ Enabled' : '❌ Disabled (No API Key)'}`);
        console.log(`   - Base URL: ${this.baseURL}`);
        if (this.apiKey) {
            console.log(`   - API Key: ${this.apiKey.substring(0, 15)}...`);
        }
        console.log(`   - Public Key: ${this.publicKey ? '✅ Set' : '❌ Missing'}`);
    }

    // ============ GET TOKEN ============
    async getToken() {
        if (!this.apiKey) {
            console.log('⚠️ Strongmb API key not configured');
            return null;
        }

        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }
        
        try {
            console.log('🔑 Getting Strongmb token...');
            
            const response = await axios.post(
                `${this.baseURL}/auth/login`,
                { apiKey: this.apiKey },
                {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                }
            );

            this.token = response.data?.data?.token || response.data?.token;
            this.tokenExpiry = Date.now() + 3600000; // 1 hour
            console.log('✅ Token received successfully');
            return this.token;
        } catch (error) {
            console.error('❌ Strongmb getToken error:');
            if (error.response) {
                console.error(`   - Status: ${error.response.status}`);
                console.error(`   - Data:`, JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(`   - Message: ${error.message}`);
            }
            return null;
        }
    }

    // ============ GET DATA PLANS ============
    async getDataPlans() {
        try {
            console.log('📡 Fetching data plans from Strongmb...');
            
            const token = await this.getToken();
            
            if (!token) {
                console.log('⚠️ No token available, using fallback plans');
                return this.getFallbackPlans();
            }
            
            const response = await axios.get(
                `${this.baseURL}/data/plans`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                }
            );

            let plans = [];
            if (response.data?.data?.plans) {
                plans = response.data.data.plans;
            } else if (response.data?.data) {
                plans = response.data.data;
            } else if (Array.isArray(response.data)) {
                plans = response.data;
            } else if (response.data?.plans) {
                plans = response.data.plans;
            }
            
            if (!plans || plans.length === 0) {
                console.log('⚠️ No plans from API, using fallback');
                return this.getFallbackPlans();
            }
            
            // Separate SME and regular plans
            const smePlans = plans.filter(plan => 
                plan.productCode?.toLowerCase().includes('sme') || 
                plan.name?.toLowerCase().includes('sme') ||
                plan.type?.toLowerCase().includes('sme')
            );
            
            console.log(`✅ Found ${plans.length} plans (${smePlans.length} SME)`);
            
            return {
                success: true,
                data: {
                    all: plans,
                    sme: smePlans,
                    regular: plans.filter(p => !smePlans.includes(p))
                },
                provider: 'strongmb'
            };
        } catch (error) {
            console.error('❌ Strongmb getDataPlans error:', error.message);
            return this.getFallbackPlans();
        }
    }

    // ============ FALLBACK PLANS ============
    getFallbackPlans() {
        const plans = [
            { productCode: 'MTN_500MB', name: 'MTN 500MB', size: '500MB', price: 220, network: 'MTN', validity: '2 Days', type: 'regular' },
            { productCode: 'MTN_1GB', name: 'MTN 1GB', size: '1GB', price: 260, network: 'MTN', validity: '30 Days', type: 'regular' },
            { productCode: 'MTN_2GB', name: 'MTN 2GB', size: '2GB', price: 590, network: 'MTN', validity: '30 Days', type: 'regular' },
            { productCode: 'MTN_5GB', name: 'MTN 5GB', size: '5GB', price: 1150, network: 'MTN', validity: '14 Days', type: 'regular' },
            { productCode: 'MTN_10GB', name: 'MTN 10GB', size: '10GB', price: 3500, network: 'MTN', validity: '30 Days', type: 'sme' },
            { productCode: 'GLO_500MB', name: 'GLO 500MB', size: '500MB', price: 205, network: 'GLO', validity: '30 Days', type: 'regular' },
            { productCode: 'GLO_1GB', name: 'GLO 1GB', size: '1GB', price: 410, network: 'GLO', validity: '30 Days', type: 'regular' },
            { productCode: 'GLO_2GB', name: 'GLO 2GB', size: '2GB', price: 820, network: 'GLO', validity: '30 Days', type: 'regular' },
            { productCode: 'GLO_5GB', name: 'GLO 5GB', size: '5GB', price: 1150, network: 'GLO', validity: '14 Days', type: 'regular' },
            { productCode: 'AIRTEL_500MB', name: 'AIRTEL 500MB', size: '500MB', price: 210, network: 'AIRTEL', validity: '2 Days', type: 'regular' },
            { productCode: 'AIRTEL_1GB', name: 'AIRTEL 1GB', size: '1GB', price: 240, network: 'AIRTEL', validity: '30 Days', type: 'regular' },
            { productCode: 'AIRTEL_2GB', name: 'AIRTEL 2GB', size: '2GB', price: 580, network: 'AIRTEL', validity: '30 Days', type: 'regular' },
            { productCode: '9MOBILE_500MB', name: '9MOBILE 500MB', size: '500MB', price: 190, network: '9MOBILE', validity: '30 Days', type: 'regular' },
            { productCode: '9MOBILE_1GB', name: '9MOBILE 1GB', size: '1GB', price: 230, network: '9MOBILE', validity: '30 Days', type: 'regular' },
            { productCode: '9MOBILE_2GB', name: '9MOBILE 2GB', size: '2GB', price: 410, network: '9MOBILE', validity: '30 Days', type: 'regular' }
        ];
        
        return {
            success: true,
            data: {
                all: plans,
                sme: plans.filter(p => p.type === 'sme'),
                regular: plans.filter(p => p.type === 'regular')
            },
            fallback: true,
            provider: 'strongmb'
        };
    }

    // ============ BUY DATA ============
    async buyData(phoneNumber, productCode, reference) {
        try {
            console.log(`📡 Buying data: phone=${phoneNumber}, product=${productCode}`);
            
            if (!this.apiKey) {
                return {
                    success: false,
                    message: 'Strongmb API key not configured'
                };
            }
            
            const token = await this.getToken();
            
            if (!token) {
                return {
                    success: false,
                    message: 'Unable to authenticate with Strongmb. Please try again later.'
                };
            }
            
            const payload = {
                phone: phoneNumber,
                productCode: productCode,
                reference: reference || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
            };
            
            const response = await axios.post(
                `${this.baseURL}/data/purchase`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return {
                success: true,
                data: response.data?.data || response.data,
                message: response.data?.message || 'Data purchased successfully'
            };
        } catch (error) {
            console.error('❌ Strongmb buyData error:', error.message);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Purchase failed'
            };
        }
    }

    // ============ BUY AIRTIME ============
    async buyAirtime(phoneNumber, amount) {
        try {
            console.log(`📡 Buying airtime: phone=${phoneNumber}, amount=${amount}`);
            
            if (!this.apiKey) {
                return {
                    success: false,
                    message: 'Strongmb API key not configured'
                };
            }
            
            const token = await this.getToken();
            
            if (!token) {
                return {
                    success: false,
                    message: 'Unable to authenticate with Strongmb'
                };
            }
            
            const payload = {
                phone: phoneNumber,
                amount: amount,
                reference: `AIR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
            };
            
            const response = await axios.post(
                `${this.baseURL}/airtime/purchase`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return {
                success: true,
                data: response.data?.data || response.data,
                message: response.data?.message || 'Airtime purchased successfully'
            };
        } catch (error) {
            console.error('❌ Strongmb buyAirtime error:', error.message);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Purchase failed'
            };
        }
    }

    // ============ GET WALLET BALANCE ============
    async getWalletBalance() {
        try {
            console.log('📡 Fetching Strongmb wallet balance...');
            
            if (!this.apiKey) {
                return { success: false, message: 'API key not configured', balance: 0 };
            }
            
            const token = await this.getToken();
            
            if (!token) {
                return { success: false, message: 'Authentication failed', balance: 0 };
            }
            
            const response = await axios.get(
                `${this.baseURL}/wallet/balance`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            const balance = response.data?.data?.balance || response.data?.balance || 0;
            console.log(`✅ Wallet balance: ₦${balance}`);
            
            return {
                success: true,
                balance: balance,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Strongmb getWalletBalance error:', error.message);
            return { success: false, message: error.message, balance: 0 };
        }
    }

    // ============ CHECK TRANSACTION STATUS ============
    async checkTransactionStatus(reference) {
        try {
            console.log(`📡 Checking transaction status: ${reference}`);
            
            if (!this.apiKey) {
                return { success: false, message: 'API key not configured' };
            }
            
            const token = await this.getToken();
            
            if (!token) {
                return { success: false, message: 'Authentication failed' };
            }
            
            const response = await axios.get(
                `${this.baseURL}/transaction/status/${reference}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            return {
                success: true,
                data: response.data?.data || response.data
            };
        } catch (error) {
            console.error('❌ Strongmb checkTransactionStatus error:', error.message);
            return {
                success: false,
                message: error.response?.data?.message || error.message
            };
        }
    }

    // ============ VERIFY PHONE NUMBER ============
    async verifyPhoneNumber(phoneNumber) {
        try {
            console.log(`📡 Verifying phone: ${phoneNumber}`);
            
            const token = await this.getToken();
            
            if (!token) {
                return { success: false, message: 'Authentication failed' };
            }
            
            const response = await axios.post(
                `${this.baseURL}/phone/verify`,
                { phone: phoneNumber },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            return {
                success: true,
                data: response.data?.data || response.data
            };
        } catch (error) {
            console.error('❌ Strongmb verifyPhone error:', error.message);
            return {
                success: false,
                message: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = new StrongmbService();