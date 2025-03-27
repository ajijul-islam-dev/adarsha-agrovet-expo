import { StyleSheet, Text, View } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Link} from 'expo-router';
import {useContext} from 'react';
import {ServicesProvider} from '../../provider/Provider.jsx'

const profile = () => {
  const {user} = useContext(ServicesProvider)
  return (
    <SafeAreaView>
      <Text>FirstTab</Text>
      <Link href='/signin'>
        <Text>Login</Text>
        <Text>{user?.name}</Text>
      </Link>
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({});