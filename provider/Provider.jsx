import { useState, createContext, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import useAxios from '../hooks/useAxios.js';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode'; // ✅ Ensure correct import

export const ServicesProvider = createContext(null);

const Provider = ({ children }) => {
  const axios = useAxios();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); // ✅ NEW: Wait until AsyncStorage loads
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'default' });
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // **🔹 Function to Show Snackbar Messages**
  const showMessage = (message, type = 'default') => {
    setSnackbar({ visible: true, message, type });
  };

  // **🔹 Function to Check Token Expiry**
  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  };

  // **🔹 Load Token & User Data on App Start**
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        setLoadingAuth(true); // ✅ Start loading

        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');

        console.log("🔍 Checking stored auth data...");
        console.log("🔹 Stored Token:", storedToken);
        console.log("🔹 Stored User:", storedUser);

        if (storedToken && isTokenValid(storedToken) && storedUser) {
          const decodedUser = JSON.parse(storedUser);

          setToken(storedToken);
          setUser(decodedUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          console.log("✅ Token & User restored successfully.");
        } else {
          console.warn("⚠️ No valid token found. Logging out...");
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Error loading auth data:", error);
      } finally {
        setLoadingAuth(false); // ✅ Stop loading
      }
    };

    loadAuthData();
  }, []);

  // **🔹 Handle API Errors & Messages**
  const getErrorMessage = (error) => {
    if (!error.response) {
      return error.message.includes('Network Error') 
        ? 'Network error: Check your internet connection' 
        : 'Something went wrong, please try again';
    }

    const errorMessages = {
      400: error.response.data.message || 'Invalid request',
      401: 'Incorrect email or password',
      403: error.response.data.message || 'Your account is not active',
      409: 'User already exists',
      500: 'Server error: Please try again later'
    };

    return errorMessages[error.response.status] || 'An unexpected error occurred';
  };

  // **🔹 Login Function**
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      console.log("🔵 Attempting to log in with:", values);

      const response = await axios.post('/login', values);
      console.log("🟢 Login API Response:", response.data);

      if (response.data.user.status !== 'active') {
        console.warn("⚠️ User account is not active!");
        throw { response: { status: 403, data: { message: 'আপনার অ্যাকাউন্ট এখনও সক্রিয় হয়নি' } } };
      }

      const newToken = response.data.token;
      console.log("🟢 Received Token:", newToken);

      if (!newToken || typeof newToken !== 'string') {
        console.error("❌ Invalid token received");
        throw new Error('Invalid token received from server');
      }

      // ✅ Save token and user in AsyncStorage
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      console.log("✅ Token & User saved successfully in AsyncStorage");

      setToken(newToken);
      setUser(response.data.user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      showMessage('লগইন সফল হয়েছে!', 'success');
      router.replace('/');

    } catch (error) {
      console.error("❌ Login Error:", error);
      showMessage(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // **🔹 Sign Up Function**
  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const userData = { ...values, role: "officer", status: "active" };
      await axios.post('/register', userData);
      showMessage('Registration successful! Please login', 'success');
      router.replace('/signin');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // **🔹 Logout Function**
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setUser(null);

      delete axios.defaults.headers.common['Authorization'];

      router.replace('/signin');
      showMessage('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // **🔹 Check Authentication Status**
  const isAuthenticated = () => !!token && !!user && isTokenValid(token);

  // **🔹 Context Value**
  const value = { loading, user, token, isAuthenticated, handleLogin, handleRegister, handleLogout };

  return (
    <ServicesProvider.Provider value={value}>
      {loadingAuth ? null : children} 
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{
          backgroundColor: snackbar.type === 'error' ? '#f44336' :
            snackbar.type === 'success' ? '#4caf50' : '#2196f3'
        }}
      >
        {snackbar.message}
      </Snackbar>
    </ServicesProvider.Provider>
  );
};

export default Provider;
