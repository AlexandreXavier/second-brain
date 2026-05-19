import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LibraryScreen } from '../screens/LibraryScreen';
import { CaptureScreen } from '../screens/CaptureScreen';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#1a1a1a',
        tabBarInactiveTintColor: '#999',
      }}>
      <Tab.Screen name="Biblioteca" component={LibraryScreen} />
      <Tab.Screen name="Capturar" component={CaptureScreen} />
    </Tab.Navigator>
  );
}
