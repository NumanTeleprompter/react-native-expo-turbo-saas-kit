import { type ReactNode, useEffect } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const SPRING = { damping: 24, stiffness: 240, mass: 0.9 } as const;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * A bottom sheet that springs in and out and can be dragged down to dismiss.
 * It doesn't dim what's behind it, so changes made inside show live. A tap
 * outside the sheet closes it.
 */
export function BottomSheet({ open, onClose, title, children }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const offset = useSharedValue(height);

  useEffect(() => {
    offset.value = withSpring(open ? 0 : height, SPRING);
  }, [open, height, offset]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  // Only the header drags, so sliders inside the sheet keep their gestures.
  const drag = Gesture.Pan()
    .onChange((event) => {
      offset.value = Math.max(0, offset.value + event.changeY);
    })
    .onEnd((event) => {
      if (
        event.velocityY > DISMISS_VELOCITY ||
        offset.value > DISMISS_DISTANCE
      ) {
        offset.value = withSpring(height, SPRING);
        scheduleOnRN(onClose);
      } else {
        offset.value = withSpring(0, SPRING);
      }
    });

  return (
    <>
      <Pressable
        accessibilityLabel="Close settings"
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        pointerEvents={open ? 'auto' : 'none'}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        accessibilityViewIsModal={open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.sheet, { maxHeight: height * 0.8 }, sheetStyle]}
      >
        <GestureDetector gesture={drag}>
          <View style={styles.header}>
            <View style={styles.handle} />

            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>

              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                hitSlop={12}
              >
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
          </View>
        </GestureDetector>

        <ScrollView
          bounces={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#18181b',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    elevation: 24,
  },
  header: { paddingTop: 10, paddingHorizontal: 20 },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  done: { color: '#60a5fa', fontSize: 16, fontWeight: '600' },
});
