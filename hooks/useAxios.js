import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAxios = () => {
  const axiosPublic = axios.create({
    baseURL: `${Constants.expoConfig.extra.API_URL || 'http://localhost:3000'}`,
  });
  
  const axiosSecure = axios.create({
    baseURL: `${Constants.expoConfig.extra.API_URL || 'http://localhost:3000'}`,
  });
  
  // Add async request interceptor
  axiosSecure.interceptors.request.use(async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        config.headers.token = token;  // Keeping your original header name
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  });
  
  return { axiosPublic, axiosSecure };
};

export default useAxios;