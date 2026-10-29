import type { ReactNode, RefObject } from 'react';

import { BlurView } from 'expo-blur';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { BLUR_SUPPORTED, type GlassPalette } from '../lib/glass';

type Props = {
  /**
   * The `BlurTargetView` whose content shows blurred through the glass, or
   * `null` for a solid surface.
   */
  target: RefObject<View | null> | null;
  palette: GlassPalette;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** A frosted glass surface that blurs the script scrolling behind it. */
export function GlassView({ target, palette, style, children }: Props) {
  // No blur over a live camera preview: it is costly and would compete with
  // the encoder, so use a solid surface instead.
  if (target === null) {
    return (
      <View
        style={[
          styles.glass,
          { borderColor: palette.border, backgroundColor: palette.solid },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      blurTarget={target}
      blurMethod="dimezisBlurViewSdk31Plus"
      intensity={60}
      tint={palette.scheme}
      style={[
        styles.glass,
        {
          borderColor: palette.border,
          backgroundColor: BLUR_SUPPORTED ? palette.fill : palette.solid,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
});
