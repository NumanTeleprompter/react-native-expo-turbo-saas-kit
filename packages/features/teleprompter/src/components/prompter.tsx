import { useEffect, useState } from 'react';

import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { withAlpha } from '../lib/color';
import {
  type PrompterSettings,
  scrollSpeed,
  updatePrompterSettings,
  usePrompterSettings,
} from '../lib/prompter-settings';
import type { Script } from '../lib/script-store';
import { useAutoScroll } from '../lib/use-auto-scroll';
import { MarkdownText } from './markdown-text';
import { PrompterControls } from './prompter-controls';
import { SettingsSheet } from './settings-sheet';

const COUNTDOWN_SECONDS = 3;
// Where the first line sits, and where the reading band is, as a share of the
// screen height.
const READING_LINE = 0.35;
// While the settings sheet is open the script slides up by this share of the
// screen height, so the text being styled stays visible above the sheet.
const SETTINGS_SHIFT = 0.3;

export function Prompter({ script }: { script: Script }) {
  useKeepAwake();

  const settings = usePrompterSettings();
  const { height } = useWindowDimensions();
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const shift = useSharedValue(0);

  useEffect(() => {
    shift.value = withTiming(settingsOpen ? -height * SETTINGS_SHIFT : 0, {
      duration: 280,
    });
  }, [settingsOpen, height, shift]);

  // One transform list for both, since a later `transform` style would
  // replace an earlier one.
  const mirror = settings.mirror;

  const stageStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: shift.value }, { scaleX: mirror ? -1 : 1 }],
    }),
    [mirror],
  );

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

  // Hardware back closes the sheet first instead of leaving the prompter.
  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setSettingsOpen(false);

        return true;
      },
    );

    return () => subscription.remove();
  }, [settingsOpen]);

  const toggle = () => {
    if (playing) {
      setPlaying(false);
    } else {
      setCountdown((current) => (current === null ? COUNTDOWN_SECONDS : null));
    }
  };

  const openSettings = () => {
    setPlaying(false);
    setCountdown(null);
    setSettingsOpen(true);
  };

  const update = (patch: Partial<PrompterSettings>) =>
    void updatePrompterSettings(patch).catch(console.error);

  const lineHeight = settings.fontSize * 1.4;

  return (
    <View
      style={[styles.container, { backgroundColor: settings.backgroundColor }]}
    >
      <StatusBar hidden />

      <Animated.View style={[styles.flex, stageStyle]}>
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
            <MarkdownText
              source={script.body}
              color={settings.textColor}
              fontSize={settings.fontSize}
              align={settings.align}
            />
          </Pressable>
        </Animated.ScrollView>

        <View
          pointerEvents="none"
          style={[
            styles.readingBand,
            {
              top: height * READING_LINE,
              height: lineHeight,
              backgroundColor: withAlpha(settings.textColor, 0.1),
            },
          ]}
        />
      </Animated.View>

      {countdown !== null && countdown > 0 ? (
        <Pressable onPress={toggle} style={styles.countdown}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </Pressable>
      ) : null}

      {countdown === null && !settingsOpen ? (
        <PrompterControls
          speed={settings.speed}
          playing={playing}
          onSpeedChange={(speed) => update({ speed })}
          onToggle={toggle}
          onRestart={scroll.restart}
          onBack={() => router.back()}
          onOpenSettings={openSettings}
        />
      ) : null}

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={update}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  text: { paddingHorizontal: 24 },
  readingBand: { position: 'absolute', left: 0, right: 0 },
  countdown: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  countdownText: { color: '#ffffff', fontSize: 160, fontWeight: '700' },
});
