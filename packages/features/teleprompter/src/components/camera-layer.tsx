import { useEffect, useRef } from 'react';

import { StyleSheet } from 'react-native';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useVideoOutput,
} from 'react-native-vision-camera';

import type { CameraFacing } from '../lib/prompter-settings';

type Props = {
  facing: CameraFacing;
  /** Starts a recording when it turns on and stops it when it turns off. */
  recording: boolean;
  /** Called with the file's path once a recording has been fully written. */
  onFinished: (path: string) => void;
  onError: (error: unknown) => void;
};

/** The live camera, filling the screen behind the script. */
export function CameraLayer({ facing, recording, onFinished, onError }: Props) {
  const device = useCameraDevice(facing);

  // Ask for the highest resolution; the camera picks the closest it supports.
  const videoOutput = useVideoOutput({
    targetResolution: CommonResolutions.UHD_16_9,
    enableAudio: true,
  });

  // Latest callbacks, so the recording effect doesn't restart when they change.
  const callbacks = useRef({ onFinished, onError });

  callbacks.current = { onFinished, onError };

  // Set when the layer is leaving the screen mid-recording: that recording is
  // abandoned (and its file deleted), not handed on to the review. Declared
  // before the recording effect, so it is set before that effect cleans up.
  const leaving = useRef(false);

  useEffect(
    () => () => {
      leaving.current = true;
    },
    [],
  );

  useEffect(() => {
    if (!recording) {
      return;
    }

    let cancelled = false;
    let end: (() => Promise<void>) | undefined;

    videoOutput
      .createRecorder({})
      .then(async (recorder) => {
        if (cancelled) {
          return;
        }

        end = () =>
          leaving.current
            ? recorder.cancelRecording()
            : recorder.stopRecording();

        await recorder.startRecording(
          (path) => callbacks.current.onFinished(path),
          (error) => callbacks.current.onError(error),
          () => undefined,
          () => undefined,
        );
      })
      .catch((error) => callbacks.current.onError(error));

    return () => {
      cancelled = true;
      // Failing to end a recording that is being torn down isn't worth a
      // message; real recording errors arrive through `onError` above.
      end?.().catch(console.error);
    };
  }, [recording, videoOutput]);

  if (!device) {
    return null;
  }

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive
      outputs={[videoOutput]}
    />
  );
}
