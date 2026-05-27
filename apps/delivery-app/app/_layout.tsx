import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { T } from '@/constants/theme';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="order/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
