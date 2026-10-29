import { useEffect, useState } from 'react';

import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated from 'react-native-reanimated';

import {
  scrollSpeed,
  updatePrompterSettings,
  usePrompterSettings,
} from '../lib/prompter-settings';
import type { Script } from '../lib/script-store';
import { useAutoScroll } from '../lib/use-auto-scroll';
import { PrompterControls } from './prompter-controls';

const COUNTDOWN_SECONDS = 3;
// Where the first line sits, and where the reading band is, as a share of the
// screen height.
const READING_LINE = 0.35;

export function Prompter({ script }: { script: Script }) {
  useKeepAwake();

  const settings = usePrompterSettings();
  const { height } = useWindowDimensions();
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const scroll = useAutoScroll({
    playing,
    speed: scrollSpeed(settings),
    onEnd: () => setPlaying(false),
    onDrag: () => setPlaying(false),
  });

  useEffect(() => {
    if (countdown === null) {
      return;
    }

    if (countdown === 0) {
      setCountdown(null);
      setPlaying(true);

      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const toggle = () => {
    if (playing) {
      setPlaying(false);
    } else {
      setCountdown((current) => (current === null ? COUNTDOWN_SECONDS : null));
    }
  };

  const lineHeight = settings.fontSize * 1.4;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={[styles.flex, settings.mirror && styles.mirrored]}>
        <Animated.ScrollView
          ref={scroll.ref}
          onScroll={scroll.onScroll}
          onContentSizeChange={scroll.onContentSizeChange}
          onLayout={scroll.onLayout}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          // Scrolling ends when the last line reaches the reading band.
          contentContainerStyle={{
            paddingTop: height * READING_LINE,
            paddingBottom: height * (1 - READING_LINE) - lineHeight,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause' : 'Start'}
            onPress={toggle}
            style={styles.text}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: settings.fontSize,
                lineHeight,
              }}
            >
              {script.body}
            </Text>
          </Pressable>
        </Animated.ScrollView>

        <View
          pointerEvents="none"
          style={[
            styles.readingBand,
            { top: height * READING_LINE, height: lineHeight },
          ]}
        />
      </View>

      {countdown !== null && countdown > 0 ? (
        <Pressable onPress={toggle} style={styles.countdown}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </Pressable>
      ) : null}

      {countdown === null ? (
        <PrompterControls
          settings={settings}
          playing={playing}
          onChange={(patch) =>
            void updatePrompterSettings(patch).catch(console.error)
          }
          onToggle={toggle}
          onRestart={scroll.restart}
          onBack={() => router.back()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  mirrored: { transform: [{ scaleX: -1 }] },
  text: { paddingHorizontal: 24 },
  readingBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  countdown: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  countdownText: { color: '#ffffff', fontSize: 160, fontWeight: '700' },
});
