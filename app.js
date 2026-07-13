import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ✅ Correct URL for web testing (backend running on localhost:3000)
const API_URL = 'http://localhost:3000/api';

// ============ LOGIN SCREEN ============
const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('08012345678');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter phone and password');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        phone: phone,
        password: password
      });

      if (response.data.success) {
        await SecureStore.setItemAsync('token', response.data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
        
        Alert.alert('Success', 'Login successful!');
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.logo}>💰 Paysbillz</Text>
        <Text style={styles.subtitle}>Airtime & Bills Payment</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Registration will be available soon')}>
            <Text style={styles.link}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============ DASHBOARD SCREEN ============
const DashboardScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData();
    loadBalance();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await axios.get(`${API_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const services = [
    { name: 'Airtime', icon: '📱' },
    { name: 'Data', icon: '📶' },
    { name: 'Electricity', icon: '💡' },
    { name: 'TV', icon: '📺' },
    { name: 'WAEC PIN', icon: '📚' },
    { name: 'JAMB PIN', icon: '🎓' },
  ];

  const handleServicePress = (serviceName) => {
    Alert.alert(serviceName, 'Coming soon!');
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.dashboardContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>₦{balance.toFixed(2)}</Text>
        <TouchableOpacity style={styles.fundButton} onPress={() => Alert.alert('Coming Soon', 'Fund wallet coming soon!')}>
          <Text style={styles.fundButtonText}>💳 Fund Wallet</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.servicesTitle}>Our Services</Text>
      <View style={styles.servicesGrid}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={styles.serviceCard}
            onPress={() => handleServicePress(service.name)}
          >
            <Text style={styles.serviceIcon}>{service.icon}</Text>
            <Text style={styles.serviceName}>{service.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  loginContainer: {
    backgroundColor: 'transparent',
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#667eea',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    marginTop: 5,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#667eea',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcome: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logout: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#667eea',
    margin: 20,
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  fundButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  fundButtonText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 14,
  },
  servicesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  serviceCard: {
    width: '30%',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
});

// ============ NAVIGATION ============
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
