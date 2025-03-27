import {useState,useContext,createContext,useEffect} from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const ServicesProvider = createContext(null);

const Provider = ({children}) => {
  
  //sign in method
  const handleLogin = (value)=>{
    alert(value.password)
  }
  
  // signUp method 
  const handleRegister = (value)=>{
    
  }
  
  
  const value = {
    test : 'context test',
    handleLogin
  }
  
  return (
    <ServicesProvider.Provider value={value}>
      {children}
    </ServicesProvider.Provider>
  );
};

export default Provider;

const styles = StyleSheet.create({});