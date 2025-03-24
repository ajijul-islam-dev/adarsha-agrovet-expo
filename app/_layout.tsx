import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {PaperProvider} from 'react-native-paper'
import { useColorScheme,MD3LightTheme as DefaultTheme } from '@/hooks/useColorScheme';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });


  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  
      const theme = {
      ...DefaultTheme,
      colors: {
        primary: 'tomato',
        secondary: 'yellow',
      },
    };

  return (
    <SafeAreaProvider>
      
      <PaperProvider theme={theme}>
          <Stack screenOptions={{
            headerShown: false,
          }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
    
      </PaperProvider>
    </SafeAreaProvider>
  );
}
