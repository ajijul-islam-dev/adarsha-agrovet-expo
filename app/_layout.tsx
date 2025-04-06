import { MD3LightTheme as DefaultTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Provider from '../provider/Provider.jsx';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'tomato',
    secondary: 'yellow',
    background: '#ffffff',
    surface: '#ffffff',
    accent: '#f1c40f',
    error: '#e74c3c',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#95a5a6',
    placeholder: '#95a5a6',
    backdrop: 'rgba(0,0,0,0.5)',
    notification: '#e74c3c',
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider>
        <PaperProvider theme={theme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </PaperProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
