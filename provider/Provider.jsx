import { useState, createContext } from 'react';
import { Snackbar } from 'react-native-paper';
import useAxios from '../hooks/useAxios.js';
import { useRouter } from 'expo-router';

export const ServicesProvider = createContext(null);

const Provider = ({ children }) => {
  const axios = useAxios();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'default' // 'default', 'error', 'success'
  });

  // Show snackbar message
  const showMessage = (message, type = 'default') => {
    setSnackbar({ visible: true, message, type });
  };

  // Handle different error scenarios
  const getErrorMessage = (error) => {
    if (!error.response) {
      return 'Network error: Please check your internet connection';
    }
    
    switch (error.response.status) {
      case 400:
        return error.response.data.message || 'Invalid request';
      case 401:
        return 'Invalid email or password';
      case 409:
        return 'User already exists';
      case 500:
        return 'Server error: Please try again later';
      default:
        return error.response.data.message || 'Something went wrong';
    }
  };

  // Sign in method
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/login', values);
      showMessage('Login successful!', 'success');
      router.replace('/home'); // Use replace to prevent going back to login
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // SignUp method 
  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const userData = {
        ...values,
        role: "officer",
        status: "pending"
      };
      const response = await axios.post('/register', userData);
      showMessage('Registration successful! Please login', 'success');
      router.replace('/signin');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    handleLogin,
    handleRegister
  };

  return (
    <ServicesProvider.Provider value={value}>
      {children}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({...snackbar, visible: false})}
        duration={3000}
        style={{
          backgroundColor: 
            snackbar.type === 'error' ? '#f44336' : 
            snackbar.type === 'success' ? '#4caf50' : '#2196f3'
        }}
      >
        {snackbar.message}
      </Snackbar>
    </ServicesProvider.Provider>
  );
};

export default Provider;