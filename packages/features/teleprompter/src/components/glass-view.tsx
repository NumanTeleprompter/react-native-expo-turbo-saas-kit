import type { ReactNode, RefObject } from 'react';

import { BlurView } from 'expo-blur';
import {
  type StyleProp,
  StyleSheet,
  type View,
  type ViewStyle,
} from 'react-native';

import { BLUR_SUPPORTED, type GlassPalette } from '../lib/glass';

type Props = {
  /** The `BlurTargetView` whose content shows blurred through the glass. */
  target: RefObject<View | null>;
  palette: GlassPalette;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** A frosted glass surface that blurs the script scrolling behind it. */
export function GlassView({ target, palette, style, children }: Props) {
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
