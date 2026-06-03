import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

import HomeScreen from './screens/HomeScreen';
import CriteriaScreen from './screens/CriteriaScreen';
import AlternativesScreen from './screens/AlternativesScreen';
import LoginScreen from './screens/LoginScreen';

import { customAlert } from './utils/alert';
import { Feather } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();

const handleLogout = () => {
  customAlert(
    'Konfirmasi Keluar',
    'Apakah Anda yakin ingin keluar dari aplikasi?',
    [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: () => signOut(auth),
      },
    ]
  );
};

const LogoutButton = () => (
  <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
    <Feather name="log-out" size={20} color="#C63D5F" />
  </TouchableOpacity>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C63D5F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined}>
        {user ? (
          // Authenticated Stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: 'Kopi Kenangan SAW',
                headerRight: () => <LogoutButton />,
                headerStyle: { backgroundColor: '#FAF7F2' },
                headerTintColor: '#3C2415',
                headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#3C2415' },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="Criteria"
              component={CriteriaScreen}
              options={{
                title: 'Kelola Kriteria',
                headerStyle: { backgroundColor: '#FAF7F2' },
                headerTintColor: '#3C2415',
                headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#3C2415' },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="Alternatives"
              component={AlternativesScreen}
              options={{
                title: 'Data Barista & Staff',
                headerStyle: { backgroundColor: '#FAF7F2' },
                headerTintColor: '#3C2415',
                headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#3C2415' },
                headerShadowVisible: false,
              }}
            />
          </>
        ) : (
          // Unauthenticated Stack
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
  },
  logoutButton: {
    marginRight: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});
