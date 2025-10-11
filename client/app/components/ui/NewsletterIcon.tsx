import React from 'react';
import Svg, { Path, Rect, Line } from 'react-native-svg';

interface NewsletterIconProps {
  size?: number;
  color?: string;
}

export default function NewsletterIcon({ size = 42, color = "#fff" }: NewsletterIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer outline */}
      <Path
        d="M4 4H16C17.1046 4 18 4.89543 18 6V18C18 19.1046 17.1046 20 16 20H6C4.89543 20 4 19.1046 4 18V4Z"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Folded edge on right */}
      <Path
        d="M18 6C19.1046 6 20 6.89543 20 8V18C20 19.1046 19.1046 20 18 20C16.8954 20 16 19.1046 16 18V4"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top two lines */}
      <Line x1="7" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round"/>
      <Line x1="7" y1="11" x2="14" y2="11" stroke={color} strokeWidth="1" strokeLinecap="round"/>
      {/* Square for image */}
      <Rect
        x="7"
        y="14"
        width="6"
        height="6"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Two small lines on the right of square */}
      <Line x1="13" y1="15" x2="17" y2="15" stroke={color} strokeWidth="1" strokeLinecap="round"/>
      <Line x1="13" y1="18" x2="17" y2="18" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    </Svg>
  );
}
