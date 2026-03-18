// src/components/TerminalLine.tsx
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/JetBrainsMono';

const { fontFamily } = loadFont();

interface Props {
  text: string;
  startFrame: number;       // frame at which typing begins
  color?: string;
  fontSize?: number;
  showCursor?: boolean;     // show blinking cursor after text
}

export const TerminalLine: React.FC<Props> = ({
  text,
  startFrame,
  color = '#c8ffc8',
  fontSize = 28,
  showCursor = false,
}) => {
  const frame = useCurrentFrame();
  const charsPerFrame = 1.8;

  const charsVisible = Math.floor(
    Math.max(0, (frame - startFrame) * charsPerFrame),
  );
  const visible = text.slice(0, Math.min(charsVisible, text.length));
  const done = charsVisible >= text.length;

  // Cursor blinks every 15 frames once typing is done
  const cursorVisible = showCursor && done && Math.floor(frame / 15) % 2 === 0;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        color,
        lineHeight: 1.6,
        whiteSpace: 'pre',
      }}
    >
      {visible}
      {cursorVisible && (
        <span
          style={{
            display: 'inline-block',
            width: fontSize * 0.55,
            height: fontSize * 0.9,
            background: color,
            verticalAlign: 'text-bottom',
            marginLeft: 2,
          }}
        />
      )}
    </div>
  );
};
