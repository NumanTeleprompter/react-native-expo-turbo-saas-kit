import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BlurTargetView } from 'expo-blur';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { requestFrameRate } from '@kit/frame-rate';

import { withAlpha } from '../lib/color';
import { glassPalette } from '../lib/glass';
import {
  type PrompterSettings,
  scrollSpeed,
  updatePrompterSettings,
  usePrompterSettings,
} from '../lib/prompter-settings';
import { type Script, renameScript } from '../lib/script-store';
import { useAutoScroll } from '../lib/use-auto-scroll';
import { useCameraAccess } from '../lib/use-camera-access';
import { CameraLayer } from './camera-layer';
import { MarkdownText } from './markdown-text';
import { PrompterControls } from './prompter-controls';
import { PrompterTopBar } from './prompter-top-bar';
import { ScriptSwitcher } from './script-switcher';
import { SettingsSheet } from './settings-sheet';

const COUNTDOWN_SECONDS = 3;
// Where the first line sits, and where the reading band is, as a share of the
// screen height.
const READING_LINE = 0.35;
// While the settings sheet is open the script slides up by this share of the
// screen height, so the text being styled stays visible above the sheet.
const SETTINGS_SHIFT = 0.3;
// How long after a scroll settles the controls fade back in.
const CONTROLS_RETURN_MS = 80;
// The longest the controls stay hidden if no end-of-scroll event arrives.
const MAX_HIDDEN_MS = 8000;

export function Prompter({ script }: { script: Script }) {
  useKeepAwake();

  const settings = usePrompterSettings();
  const { height } = useWindowDimensions();
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const requestCameraAccess = useCameraAccess();

  // A recording lasts as long as the script plays: pausing, reaching the end
  // or opening a sheet ends it and opens the review.
  useEffect(() => {
    if (!playing) {
      setRecording(false);
    }
  }, [playing]);
  // The prompter stays mounted under the review screen, so let go of the
  // camera while it isn't showing.
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();

  // The glass controls blur whatever is drawn inside this target.
  const blurTarget = useRef<View>(null);
  const palette = useMemo(
    () => glassPalette(settings.backgroundColor),
    [settings.backgroundColor],
  );
  // Over a live camera, glass drops its blur and uses a solid surface.
  const glassTarget = cameraOn ? null : blurTarget;
  const pxPerSecond = scrollSpeed(settings);

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

  // Controls step aside while the script is dragged or flung, and return a
  // moment after it settles.
  const [scrolling, setScrolling] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const onScrollingChange = useCallback((active: boolean) => {
    clearTimeout(settleTimer.current);

    if (active) {
      setScrolling(true);

      // Safety net: a cancelled touch may never report that it ended.
      settleTimer.current = setTimeout(
        () => setScrolling(false),
        MAX_HIDDEN_MS,
      );
    } else {
      settleTimer.current = setTimeout(
        () => setScrolling(false),
        CONTROLS_RETURN_MS,
      );
    }
  }, []);

  const scroll = useAutoScroll({
    playing,
    speed: pxPerSecond,
    onEnd: () => setPlaying(false),
    onDrag: () => setPlaying(false),
    onScrollingChange,
  });

  // Android holds a self-scrolling script at about 60 Hz unless asked.
  useEffect(() => {
    if (!playing) {
      return;
    }

    requestFrameRate(120);

    return () => requestFrameRate(0);
  }, [playing]);

  useEffect(() => {
    if (countdown === null) {
      return;
    }

    if (countdown === 0) {
      setCountdown(null);
      setPlaying(true);
      setRecording(cameraOn);

      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);

    return () => clearTimeout(timer);
  }, [countdown, cameraOn]);

  // Hardware back closes the sheet or list first instead of leaving the
  // prompter.
  const overlayOpen = settingsOpen || switcherOpen;

  useEffect(() => {
    if (!overlayOpen) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setSettingsOpen(false);
        setSwitcherOpen(false);

        return true;
      },
    );

    return () => subscription.remove();
  }, [overlayOpen]);

  const toggle = () => {
    if (playing) {
      setPlaying(false);
    } else {
      setCountdown((current) => (current === null ? COUNTDOWN_SECONDS : null));
    }
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      setCameraOn(false);
    } else if (await requestCameraAccess()) {
      setCameraOn(true);
    }
  };

  const onRecorded = (path: string) =>
    router.push(`/review?uri=${encodeURIComponent(`file://${path}`)}`);

  const openSettings = () => {
    setPlaying(false);
    setCountdown(null);
    setSettingsOpen(true);
  };

  const openSwitcher = () => {
    setPlaying(false);
    setCountdown(null);
    setSwitcherOpen(true);
  };

  const selectScript = (id: string) => {
    setSwitcherOpen(false);

    // The route keys the prompter by script id, so it starts fresh.
    if (id !== script.id) {
      router.setParams({ id });
    }
  };

  const update = (patch: Partial<PrompterSettings>) =>
    void updatePrompterSettings(patch).catch(console.error);

  const lineHeight = settings.fontSize * 1.4;

  return (
    <View
      style={[styles.container, { backgroundColor: settings.backgroundColor }]}
    >
      <StatusBar hidden />

      {cameraOn && focused ? (
        <CameraLayer
          facing={settings.cameraFacing}
          recording={recording}
          onFinished={onRecorded}
          onError={(error) => {
            console.error(error);
            setRecording(false);
            Alert.alert('Recording failed');
          }}
        />
      ) : null}

      <BlurTargetView
        ref={blurTarget}
        style={[
          styles.flex,
          {
            backgroundColor: cameraOn
              ? 'transparent'
              : settings.backgroundColor,
          },
        ]}
      >
        {/* The blur only captures what is drawn inside the target, so give it
            an opaque page of its own to frost. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              // Dimmed over the camera, so the text stays readable.
              backgroundColor: cameraOn
                ? withAlpha(settings.backgroundColor, 0.65)
                : settings.backgroundColor,
            },
          ]}
        />

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
            {/* Tapping the script starts or pauses. It isn't announced as a
                button, so TalkBack reads the script itself; the panel has
                the labelled Start and Pause buttons. */}
            <Pressable accessible={false} onPress={toggle} style={styles.text}>
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
      </BlurTargetView>

      {countdown !== null && countdown > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Starting in ${countdown}. Tap to cancel`}
          onPress={toggle}
          style={styles.countdown}
        >
          <Text style={styles.countdownText}>{countdown}</Text>
        </Pressable>
      ) : null}

      {countdown === null && !settingsOpen ? (
        <>
          <PrompterTopBar
            title={script.title}
            palette={palette}
            target={glassTarget}
            pxPerSecond={pxPerSecond}
            getProgress={scroll.getProgress}
            onBack={() => router.back()}
            onOpenSettings={openSettings}
            onOpenList={openSwitcher}
            cameraOn={cameraOn}
            cameraLocked={recording}
            onToggleCamera={() => void toggleCamera()}
            onRename={(title) => renameScript(script.id, title)}
            hidden={scrolling}
          />

          <PrompterControls
            speed={settings.speed}
            fontSize={settings.fontSize}
            mirror={settings.mirror}
            playing={playing}
            cameraOn={cameraOn}
            recording={recording}
            hidden={scrolling}
            palette={palette}
            target={glassTarget}
            onChange={update}
            onToggle={toggle}
            onRestart={scroll.restart}
          />
        </>
      ) : null}

      <ScriptSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        currentId={script.id}
        palette={palette}
        target={glassTarget}
        top={insets.top + 12 + 48 + 8}
        onSelect={selectScript}
      />

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
  // A readable column that doesn't stretch across a tablet.
  text: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  readingBand: { position: 'absolute', left: 0, right: 0 },
  countdown: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  countdownText: { color: '#ffffff', fontSize: 160, fontWeight: '700' },
});
