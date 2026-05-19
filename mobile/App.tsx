import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from './src/lib/firebase';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SignInScreen } from './src/screens/SignInScreen';

export default function App() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    return auth().onAuthStateChanged(nextUser => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  if (!authReady) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? <AppNavigator /> : <SignInScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
