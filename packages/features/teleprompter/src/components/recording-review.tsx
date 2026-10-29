import { useEffect, useState } from 'react';

import { useEvent } from 'expo';
import { File } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Check, Download, Trash2 } from 'lucide-react-native';
import {
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Status = 'idle' | 'saving' | 'saved';

/**
 * Plays back a fresh recording at its own size and quality, so it can be
 * saved to the gallery or thrown away.
 */
export function RecordingReview({ uri }: { uri: string }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>('idle');

  const player = useVideoPlayer(uri);
  const { videoTrack } = useEvent(player, 'videoTrackChange', {
    videoTrack: player.videoTrack,
  });

  // The recording sits in the app's cache until it is saved or discarded.
  const removeFile = () => {
    try {
      new File(uri).delete();
    } catch (error) {
      console.error(error);
    }
  };

  const save = async () => {
    setStatus('saving');

    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync(true);

      if (!granted) {
        throw new Error('Gallery permission was not granted');
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      setStatus('saved');
    } catch (error) {
      console.error(error);
      setStatus('idle');
      Alert.alert('Could not save the video');
    }
  };

  const discard = () =>
    Alert.alert('Discard this recording?', 'It can’t be recovered.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          removeFile();
          router.back();
        },
      },
    ]);

  // Back asks what to do with the recording instead of leaving it behind.
  useEffect(() => {
    if (status === 'saved') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        discard();

        return true;
      },
    );

    return () => subscription.remove();
  });

  // Resolution and frame rate as recorded, so the quality is visible.
  const details = videoTrack
    ? `${videoTrack.size.width} × ${videoTrack.size.height}` +
      (videoTrack.frameRate ? ` · ${Math.round(videoTrack.frameRate)} fps` : '')
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* `contain` keeps the recording's own aspect ratio, never cropped. */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
        accessibilityLabel="Your recording"
      />

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {details ? (
          <Text maxFontSizeMultiplier={1.5} style={styles.details}>
            {details}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard recording"
            disabled={status === 'saving'}
            onPress={discard}
            android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
            style={[styles.button, styles.secondary]}
          >
            <Trash2 color="#ffffff" size={20} />
            <Text maxFontSizeMultiplier={1.5} style={styles.buttonText}>
              Discard
            </Text>
          </Pressable>

          {status === 'saved' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Saved to gallery. Done"
              onPress={() => {
                removeFile();
                router.back();
              }}
              android_ripple={{ color: 'rgba(255,255,255,0.35)' }}
              style={[styles.button, styles.primary]}
            >
              <Check color="#ffffff" size={20} />
              <Text maxFontSizeMultiplier={1.5} style={styles.buttonText}>
                Saved, done
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save to gallery"
              accessibilityState={{ busy: status === 'saving' }}
              disabled={status === 'saving'}
              onPress={() => void save()}
              android_ripple={{ color: 'rgba(255,255,255,0.35)' }}
              style={[styles.button, styles.primary]}
            >
              <Download color="#ffffff" size={20} />
              <Text maxFontSizeMultiplier={1.5} style={styles.buttonText}>
                {status === 'saving' ? 'Saving…' : 'Save to gallery'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  video: { flex: 1 },
  panel: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  details: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 26,
    overflow: 'hidden',
  },
  secondary: { backgroundColor: 'rgba(255,255,255,0.14)' },
  primary: { backgroundColor: '#2563eb' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
