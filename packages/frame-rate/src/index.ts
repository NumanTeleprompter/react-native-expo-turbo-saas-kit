import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

const native = requireOptionalNativeModule<{
  request: (hz: number) => void;
}>('FrameRate');

/** Asks Android for a display refresh rate in Hz; 0 clears the request. */
export function requestFrameRate(hz: number) {
  if (Platform.OS === 'android') {
    native?.request(hz);
  }
}
