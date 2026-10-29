import { useMemo } from 'react';

import { StyleSheet, Text, type TextStyle, View } from 'react-native';

import { withAlpha } from '../lib/color';
import { type Block, parseMarkdown } from '../lib/markdown';
import type { TextAlign } from '../lib/prompter-settings';

const LINE_HEIGHT = 1.4;
const HEADING_SCALE = { 1: 1.6, 2: 1.35, 3: 1.15 } as const;

type Style = { color: string; fontSize: number; align: TextAlign };

export function MarkdownText({ source, ...style }: Style & { source: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source]);

  return (
    <View>
      {blocks.map((block, index) => (
        <View
          key={index}
          style={{
            marginTop:
              index === 0 ? 0 : gap(blocks[index - 1]!, block, style.fontSize),
          }}
        >
          <BlockView block={block} {...style} />
        </View>
      ))}
    </View>
  );
}

// List items sit closer together than separate paragraphs.
function gap(previous: Block, block: Block, fontSize: number) {
  const isList = (b: Block) => b.type === 'bullet' || b.type === 'number';

  return fontSize * (isList(previous) && isList(block) ? 0.25 : 0.8);
}

function BlockView({
  block,
  color,
  fontSize,
  align,
}: Style & { block: Block }) {
  const text = (size: number, extra?: TextStyle): TextStyle => ({
    color,
    fontSize: size,
    lineHeight: size * LINE_HEIGHT,
    textAlign: align,
    ...extra,
  });

  switch (block.type) {
    case 'heading': {
      const size = fontSize * HEADING_SCALE[block.level];

      return (
        <Text style={text(size, { fontWeight: '700' })}>
          <Spans spans={block.spans} />
        </Text>
      );
    }

    case 'quote':
      return (
        <View
          style={{
            borderLeftWidth: 4,
            borderLeftColor: withAlpha(color, 0.5),
            paddingLeft: fontSize * 0.6,
          }}
        >
          <Text style={text(fontSize, { fontStyle: 'italic', opacity: 0.85 })}>
            <Spans spans={block.spans} />
          </Text>
        </View>
      );

    case 'bullet':
    case 'number':
      return (
        <View style={styles.row}>
          <Text style={[text(fontSize), { width: fontSize * 1.3 }]}>
            {block.type === 'bullet' ? '•' : block.marker}
          </Text>

          <Text style={[text(fontSize), styles.flex]}>
            <Spans spans={block.spans} />
          </Text>
        </View>
      );

    case 'rule':
      return (
        <View
          style={{
            height: 2,
            marginVertical: fontSize * 0.3,
            backgroundColor: withAlpha(color, 0.4),
          }}
        />
      );

    default:
      return (
        <Text style={text(fontSize)}>
          <Spans spans={block.spans} />
        </Text>
      );
  }
}

function Spans({
  spans,
}: {
  spans: Extract<Block, { spans: unknown }>['spans'];
}) {
  return spans.map((span, index) => (
    <Text
      key={index}
      style={{
        fontWeight: span.bold ? '700' : undefined,
        fontStyle: span.italic ? 'italic' : undefined,
      }}
    >
      {span.text}
    </Text>
  ));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
});
