import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface UserAvatarProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function UserAvatar({
  size = 40,
  color = "#FFFFFF",
  strokeWidth = 2,
}: UserAvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Circle cx="20" cy="20" r="19" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="20" cy="16" r="6" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M8 34.5C8 34.5 11 26 20 26C29 26 32 34.5 32 34.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
