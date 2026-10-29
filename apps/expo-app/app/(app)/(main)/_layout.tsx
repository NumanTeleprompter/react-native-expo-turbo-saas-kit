import { useEffect } from 'react';

import { Redirect, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SettingsIcon } from 'lucide-react-native';

import {
  AuthProvider,
  AuthProviderLoading,
  AuthProviderSignedIn,
  AuthProviderSignedOut,
} from '@kit/supabase';

void SplashScreen.preventAutoHideAsync();

export default function MainLayout() {
  return (
    <AuthProvider>
      <AuthProviderLoading>
        <SplashScreenLoading />
      </AuthProviderLoading>

      <AuthProviderSignedIn>
        <MainLayoutTabs />
      </AuthProviderSignedIn>

      <AuthProviderSignedOut>
        <Redirect href={'/auth/sign-in'} />
      </AuthProviderSignedOut>
    </AuthProvider>
  );
}

function MainLayoutTabs() {
  return (
    <Tabs initialRouteName={'settings'}>
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: '/settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function SplashScreenLoading() {
  useEffect(() => {
    return () => {
      void SplashScreen.hideAsync();
    };
  });

  return null;
}
