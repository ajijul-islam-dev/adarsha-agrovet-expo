import axios from 'axios';
import Constants from 'expo-constants';

const useAxios = (url) => {
  return axios.create({
    baseURL: `${Constants.expoConfig.extra.API_URL || 'http://localhost:3000'}`,
  });
};

export default useAxios;
