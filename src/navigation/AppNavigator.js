import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import MapaScreen from '../screens/MapaScreen';
import RegistrarScreen from '../screens/RegistrarScreen';
import DetalheScreen from '../screens/DetalheScreen';
import GestorScreen from '../screens/GestorScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Mapa"
        component={MapaScreen}
        options={{ tabBarIcon: () => <Text>🗺️</Text> }}
      />
      <Tab.Screen
        name="Gestor"
        component={GestorScreen}
        options={{ tabBarIcon: () => <Text>🔧</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Registrar" component={RegistrarScreen} options={{ title: 'Registrar Problema' }} />
        <Stack.Screen name="Detalhe" component={DetalheScreen} options={{ title: 'Detalhe da Ocorrência' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}