import { useContext } from 'react';
import { Redirect } from 'expo-router';
import { ServicesProvider } from '../provider/Provider';
import { ActivityIndicator, View } from 'react-native';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loadingAuth, user } = useContext(ServicesProvider);

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated() || user?.status !== 'active') {
    return <Redirect href="/signin" />;
  }

  return children;
};

export default ProtectedRoute;