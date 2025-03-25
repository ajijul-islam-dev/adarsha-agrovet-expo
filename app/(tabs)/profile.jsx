import { StyleSheet, Text, View } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Link} from 'expo-router';

const profile = () => {
  return (
    <SafeAreaView>
      <Text>FirstTab</Text>
      <Link href='/signin'>
        <Text>Login</Text>
      </Link>
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({});