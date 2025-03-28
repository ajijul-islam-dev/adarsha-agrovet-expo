import { useState, createContext, useEffect, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';
import useAxios from '../hooks/useAxios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const ServicesProvider = createContext(null);

const AuthProvider = ({ children }) => {
  const { axiosPublic, axiosSecure } = useAxios();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'default' });
  const [user, setUser] = useState(null);

  const showMessage = (message, type = 'default') => {
    setSnackbar({ visible: true, message, type });
  };

  const getErrorMessage = (error) => {
    if (error.response) {
      // Handle specific error messages from server
      if (error.response.data && error.response.data.message) {
        return error.response.data.message;
      }
      // Default messages based on status code
      switch (error.response.status) {
        case 401:
          return 'Invalid credentials';
        case 403:
          return 'Unauthorized access';
        case 404:
          return 'Resource not found';
        case 500:
          return 'Server error';
        default:
          return 'An error occurred';
      }
    } else if (error.request) {
      return 'No response from server';
    } else {
      return error.message || 'An unknown error occurred';
    }
  };

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setLoadingAuth(false);
        return;
      }

      const response = await axiosSecure.get('/current-user');
      if (response.data.success && response.data.user) {
        // Check if user is active
        if (response.data.user.status !== 'active') {
          showMessage('Your account is not active', 'error');
          await handleLogout();
          return;
        }
        setUser(response.data.user);
      } else {
       // await handleLogout();
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      showMessage(getErrorMessage(error), 'error');
      await handleLogout();
    } finally {
      setLoadingAuth(false);
    }
  }, [axiosSecure]);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await axiosPublic.post('/login', values);
      if (res.data.token) {
        await AsyncStorage.setItem('authToken', res.data.token);
        const userResponse = await axiosSecure.get('/current-user');
        
        // Verify user is active after login
        if (userResponse.data.user.status !== 'active') {
          showMessage('Your account is not active', 'error');
          await handleLogout();
          return;
        }

        setUser(userResponse.data.user);
        showMessage('Login successful!', 'success');
        router.replace('/');
      } else {
        showMessage('Login failed: No token received', 'error');
      }
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      await axiosPublic.post('/register', values);
      showMessage('Registration successful! Please login', 'success');
      router.replace('/signin');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      router.replace('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      showMessage('Failed to logout', 'error');
    }
  };

  const isAuthenticated = () => {
    return !!user && user.status === 'active';
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const currentRoute = router.pathname || '';
      
      if (!token && !['/signin', '/register'].includes(currentRoute)) {
        router.replace('/signin');
      } else if (token) {
        await fetchCurrentUser();
        
        // If user is not active, redirect to login
        if (user && user.status !== 'active' && !['/signin', '/register'].includes(currentRoute)) {
          router.replace('/signin');
        }
      }
    };

    checkAuth();
  }, [router.pathname]);

  const value = { 
    loading, 
    loadingAuth,
    user, 
    isAuthenticated, 
    handleLogin, 
    handleRegister, 
    handleLogout,
    showMessage,
    fetchCurrentUser
  };

  return (
    <ServicesProvider.Provider value={value}>
      {children}
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

export default AuthProvider;