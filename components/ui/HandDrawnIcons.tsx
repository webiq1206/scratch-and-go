import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const HandDrawnHome: React.FC<IconProps> = ({ size = 24, color = '#FF6B9D' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 12.8C3.4 12.2 3.3 11.7 3.8 11.3L11.2 4.2C11.7 3.8 12.3 3.8 12.8 4.2L20.2 11.3C20.7 11.7 20.6 12.2 20.5 12.8L20.3 19.8C20.2 20.4 19.8 20.9 19.2 21L4.8 21C4.2 21 3.8 20.5 3.7 19.9L3.5 12.8Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.2 20.9L9.1 15.2C9.1 14.6 9.5 14.1 10.1 14.1L13.9 14C14.5 14 14.9 14.4 14.9 15L14.8 20.9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11.8 4.3C11.9 4.2 12 4.1 12.2 4.2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const HandDrawnBookHeart: React.FC<IconProps> = ({ size = 24, color = '#FF6B9D' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.2 19.8L4 5.2C4 4.6 4.4 4.1 5 4L16.8 4C17.4 4 17.9 4.4 17.9 5L18.1 18.8C18.1 19.4 17.7 19.9 17.1 20L5.3 20.1C4.7 20.1 4.2 19.7 4.2 19.8Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.8 3.9L7.9 20.1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M9.2 10.8C9.1 10.2 9.3 9.7 9.8 9.4C10.3 9.1 10.9 9.2 11.2 9.6L11.3 9.7C11.4 9.8 11.6 9.8 11.7 9.7L11.8 9.6C12.1 9.2 12.7 9.1 13.2 9.4C13.7 9.7 13.9 10.2 13.8 10.8C13.7 11.4 13.3 11.9 12.8 12.3L11.6 13.3C11.5 13.4 11.4 13.4 11.4 13.3L10.2 12.3C9.7 11.9 9.3 11.4 9.2 10.8Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.9 20.1C18.8 20.2 19.6 19.9 19.9 19.1L19.8 5.8C19.8 5.2 19.4 4.8 18.8 4.9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const HandDrawnSettings: React.FC<IconProps> = ({ size = 24, color = '#FF6B9D' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.8 3.2L10.2 5.8C10.1 6.2 9.7 6.5 9.3 6.6L9.2 6.7C8.8 6.8 8.4 6.7 8.1 6.4L6.1 4.7C5.7 4.4 5.1 4.5 4.8 4.9L3.3 7.1C3 7.5 3.1 8.1 3.5 8.4L5.3 9.8C5.6 10 5.8 10.4 5.7 10.8V11.2C5.8 11.6 5.6 12 5.3 12.2L3.5 13.6C3.1 13.9 3 14.5 3.3 14.9L4.8 17.1C5.1 17.5 5.7 17.6 6.1 17.3L8.1 15.6C8.4 15.3 8.8 15.2 9.2 15.3L9.3 15.4C9.7 15.5 10.1 15.8 10.2 16.2L10.8 18.8C10.9 19.3 11.4 19.6 11.9 19.6L14.8 19.6C15.3 19.6 15.8 19.3 15.9 18.8L16.5 16.2C16.6 15.8 17 15.5 17.4 15.4L17.5 15.3C17.9 15.2 18.3 15.3 18.6 15.6L20.6 17.3C21 17.6 21.6 17.5 21.9 17.1L23.4 14.9C23.7 14.5 23.6 13.9 23.2 13.6L21.4 12.2C21.1 12 20.9 11.6 21 11.2V10.8C20.9 10.4 21.1 10 21.4 9.8L23.2 8.4C23.6 8.1 23.7 7.5 23.4 7.1L21.9 4.9C21.6 4.5 21 4.4 20.6 4.7L18.6 6.4C18.3 6.7 17.9 6.8 17.5 6.7L17.4 6.6C17 6.5 16.6 6.2 16.5 5.8L15.9 3.2C15.8 2.7 15.3 2.4 14.8 2.4L11.9 2.4C11.4 2.4 10.9 2.7 10.8 3.2Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.35 9.8C14.8 9.9 15.9 11.1 15.8 12.6C15.7 14.1 14.5 15.2 13 15.1C11.5 15 10.4 13.8 10.5 12.3C10.6 10.8 11.85 9.7 13.35 9.8Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
