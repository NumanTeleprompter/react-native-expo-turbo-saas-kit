import { Stack } from 'expo-router';

export default function TeleprompterLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Scripts' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Script' }} />
      <Stack.Screen name="prompter/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="review" options={{ headerShown: false }} />
    </Stack>
  );
}
