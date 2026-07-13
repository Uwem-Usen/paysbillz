// services/inlomax.js
const axios = require('axios');
require('dotenv').config();

class InlomaxService {
    constructor() {
        this.apiKey = process.env.INLOMAX_API_KEY;
        this.baseURL = process.env.INLOMAX_BASE_URL || 'https://inlomax.com/api/';
        
        console.log('========================================');
        console.log('🔑 Inlomax API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : '❌ MISSING');
        console.log('📡 Inlomax Base URL:', this.baseURL);
        console.log('========================================');
        
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Token ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });
    }

    // ============ GET ALL DATA PLANS ============
    async getDataPlans() {
        try {
            console.log('📡 Fetching data plans from Inlomax...');
            
            // Fetch all services
            const response = await this.client.get('/services');
            
            console.log('✅ Inlomax response status:', response.status);
            
            if (response.data && response.data.status === 'success') {
                // The data plans are inside response.data.data.dataPlans
                const dataObject = response.data.data || {};
                const dataPlans = dataObject.dataPlans || [];
                
                console.log(`📊 Found ${dataPlans.length} data plans from Inlomax`);
                
                if (dataPlans.length === 0) {
                    console.log('⚠️ No data plans found in Inlomax account');
                    return {
                        success: true,
                        data: {},
                        all: [],
                        total: 0,
                        networks: [],
                        message: 'No data plans available in your Inlomax account'
                    };
                }
                
                // Group by network
                const grouped = {};
                dataPlans.forEach(plan => {
                    const network = plan.network || 'MTN';
                    if (!grouped[network]) {
                        grouped[network] = [];
                    }
                    
                    grouped[network].push({
                        serviceID: plan.serviceID || plan.id || plan.code,
                        name: plan.dataPlan || plan.plan || plan.name || 'Data Bundle',
                        price: parseFloat(plan.amount || plan.price || 0),
                        validity: plan.validity || plan.duration || 'N/A',
                        type: plan.dataType || plan.type || 'SME'
                    });
                });
                
                console.log(`📶 Networks found: ${Object.keys(grouped).join(', ')}`);
                
                return {
                    success: true,
                    data: grouped,
                    all: dataPlans,
                    total: dataPlans.length,
                    networks: Object.keys(grouped)
                };
            }
            
            console.log('⚠️ Inlomax returned error:', response.data?.message);
            return {
                success: false,
                message: response.data?.message || 'No data plans found'
            };
        } catch (error) {
            console.error('❌ Inlomax getDataPlans error:', error.response?.data || error.message);
            
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            }
            
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch data plans'
            };
        }
    }

    // ============ BUY DATA ============
    async buyData(serviceID, phoneNumber) {
        try {
            console.log(`📡 Buying data: serviceID=${serviceID}, phone=${phoneNumber}`);
            
            const response = await this.client.post('/data', {
                serviceID: serviceID,
                mobileNumber: phoneNumber
            });

            console.log('✅ Buy data response:', response.data);

            return this.handleResponse(response.data);
        } catch (error) {
            console.error('❌ Inlomax buyData error:', error.response?.data || error.message);
            return this.handleError(error);
        }
    }

    // ============ BUY AIRTIME ============
    async buyAirtime(phoneNumber, amount) {
        try {
            console.log(`📡 Buying airtime: phone=${phoneNumber}, amount=${amount}`);
            
            const response = await this.client.post('/airtime', {
                mobileNumber: phoneNumber,
                amount: amount
            });

            return this.handleResponse(response.data);
        } catch (error) {
            console.error('❌ Inlomax buyAirtime error:', error.response?.data || error.message);
            return this.handleError(error);
        }
    }

    // ============ PAY ELECTRICITY ============
    async payElectricity(serviceID, meterNumber, amount) {
        try {
            console.log(`📡 Paying electricity: meter=${meterNumber}, amount=${amount}`);
            
            const response = await this.client.post('/electricity', {
                serviceID: serviceID,
                billersCode: meterNumber,
                amount: amount
            });

            return this.handleResponse(response.data);
        } catch (error) {
            console.error('❌ Inlomax payElectricity error:', error.response?.data || error.message);
            return this.handleError(error);
        }
    }

    // ============ FUND BETTING ============
    async fundBetting(serviceID, customerId, amount) {
        try {
            console.log(`📡 Funding betting: customerId=${customerId}, amount=${amount}`);
            
            const response = await this.client.post('/betting', {
                serviceID: serviceID,
                customerId: customerId,
                amount: amount
            });

            return this.handleResponse(response.data);
        } catch (error) {
            console.error('❌ Inlomax fundBetting error:', error.response?.data || error.message);
            return this.handleError(error);
        }
    }

    // ============ SUBSCRIBE CABLE ============
    async subscribeCable(smartCardNumber, packageName, amount) {
        try {
            console.log(`📡 Subscribing cable: card=${smartCardNumber}, package=${packageName}`);
            
            const response = await this.client.post('/cable', {
                smartCardNumber: smartCardNumber,
                packageName: packageName,
                amount: amount
            });

            return this.handleResponse(response.data);
        } catch (error) {
            console.error('❌ Inlomax cable subscription error:', error.response?.data || error.message);
            return this.handleError(error);
        }
    }

    // ============ CHECK TRANSACTION STATUS ============
    async checkStatus(reference) {
        try {
            console.log(`📡 Checking status: reference=${reference}`);
            
            const response = await this.client.get(`/transaction/${reference}`);
            return this.handleResponse(response.data);
        } catch (error) {
            console.error('❌ Inlomax checkStatus error:', error.response?.data || error.message);
            return this.handleError(error);
        }
    }

    // ============ CLEAR CACHE ============
    clearCache() {
        console.log('🧹 Cache cleared');
        return { success: true, message: 'Cache cleared' };
    }

    // ============ RESPONSE HANDLERS ============
    handleResponse(data) {
        if (data.status === 'success') {
            return {
                success: true,
                data: data.data,
                message: data.message || 'Transaction successful'
            };
        } else if (data.status === 'processing') {
            return {
                success: true,
                data: data.data,
                message: data.message || 'Transaction is processing',
                processing: true
            };
        } else {
            return {
                success: false,
                message: data.message || 'Transaction failed'
            };
        }
    }

    handleError(error) {
        if (error.response) {
            return {
                success: false,
                message: error.response.data?.message || 'API request failed',
                code: error.response.status
            };
        }
        return {
            success: false,
            message: error.message || 'Network error'
        };
    }
}

module.exports = new InlomaxService();