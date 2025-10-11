import React from 'react';
import Svg, { Line, Path } from 'react-native-svg';

interface SpeakerIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function SpeakerIcon({
  size = 30,
  color = '#FFFFFF',
  strokeWidth = 1.6,
}: SpeakerIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9.5V14.5C4 14.7761 4.22386 15 4.5 15H7L12.5 18.5V5.5L7 9.5H4.5C4.22386 9.5 4 9.72386 4 10Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 14.5L3 17.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="15"
        y1="8.5"
        x2="17.8"
        y2="6.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1="15.5"
        y1="12"
        x2="18.7"
        y2="12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1="15"
        y1="15.5"
        x2="18.4"
        y2="17.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
