import React from 'react';
import { Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RecordScreen from './src/screens/RecordScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import DetailScreen from './src/screens/DetailScreen';

const Stack = createNativeStackNavigator();

const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0E1116',
    card: '#0E1116',
    text: '#E7EAF0',
    border: '#171B21',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator>
        <Stack.Screen
          name="Record"
          component={RecordScreen}
          options={({ navigation }) => ({
            title: 'Transcriber',
            headerRight: () => (
              <Pressable onPress={() => navigation.navigate('History')}>
                <Text style={{ color: '#2D6CDF', fontSize: 15, fontWeight: '600' }}>
                  History
                </Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Transcript' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
