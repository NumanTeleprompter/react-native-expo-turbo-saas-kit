import { useCallback } from 'react';

import { Alert, Linking } from 'react-native';
import {
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';

/**
 * Returns a function that asks for the camera and microphone and resolves with
 * whether both were granted. If one was refused for good, it points the user
 * to the system settings.
 */
export function useCameraAccess() {
  const camera = useCameraPermission();
  const microphone = useMicrophonePermission();

  return useCallback(async () => {
    const granted = async (permission: typeof camera) =>
      permission.hasPermission ||
      (permission.canRequestPermission &&
        (await permission.requestPermission()));

    if ((await granted(camera)) && (await granted(microphone))) {
      return true;
    }

    Alert.alert(
      'Camera and microphone needed',
      'Allow both in Settings to record yourself reading.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open settings', onPress: () => void Linking.openSettings() },
      ],
    );

    return false;
  }, [camera, microphone]);
}
