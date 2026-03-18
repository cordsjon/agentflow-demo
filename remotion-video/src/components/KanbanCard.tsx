// src/components/KanbanCard.tsx
import React from 'react';
import { useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { THEME } from '../lib/theme';

const { fontFamily } = loadFont();

interface Props {
  title: string;
  tag?: string;
  tagColor?: string;
  delayFrames?: number;
  width?: number;
}

export const KanbanCard: React.FC<Props> = ({
  title,
  tag,
  tagColor = THEME.accent,
  delayFrames = 0,
  width = 380,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delayFrames,
    fps,
    config: { stiffness: 80, damping: 14 },
  });

  const x = (1 - progress) * -60;
  const opacity = progress;

  return (
    <div
      style={{
        fontFamily,
        width,
        background: '#14141e',
        border: `1.5px solid ${tagColor}44`,
        borderLeft: `4px solid ${tagColor}`,
        borderRadius: 10,
        padding: '14px 18px',
        transform: `translateX(${x}px)`,
        opacity,
      }}
    >
      {tag && (
        <div
          style={{
            display: 'inline-block',
            fontFamily: THEME.fontMono,
            fontSize: 11,
            color: tagColor,
            background: `${tagColor}22`,
            border: `1px solid ${tagColor}55`,
            borderRadius: 20,
            padding: '2px 10px',
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          {tag}
        </div>
      )}
      <div style={{ fontSize: 20, fontWeight: 600, color: THEME.white }}>
        {title}
      </div>
    </div>
  );
};
