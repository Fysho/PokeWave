import React from 'react';

interface PixelIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Base style for all pixel icons - ensures crisp rendering
const baseStyle: React.CSSProperties = {
  imageRendering: 'pixelated',
  display: 'inline-block',
};

// SVG-based pixel icons that match Pokemon DS era aesthetic
// Each icon is designed on a 16x16 or 24x24 grid for that authentic retro feel

export const PixelPokeball: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Top half - red */}
    <rect x="5" y="1" width="6" height="1" fill="#dc2626" />
    <rect x="3" y="2" width="10" height="1" fill="#dc2626" />
    <rect x="2" y="3" width="12" height="1" fill="#dc2626" />
    <rect x="1" y="4" width="14" height="1" fill="#dc2626" />
    <rect x="1" y="5" width="14" height="1" fill="#dc2626" />
    <rect x="1" y="6" width="14" height="1" fill="#dc2626" />
    {/* Center line */}
    <rect x="1" y="7" width="5" height="2" fill="#1f2937" />
    <rect x="10" y="7" width="5" height="2" fill="#1f2937" />
    {/* Center button */}
    <rect x="6" y="6" width="4" height="4" fill="#f3f4f6" />
    <rect x="7" y="7" width="2" height="2" fill="#1f2937" />
    {/* Bottom half - white */}
    <rect x="1" y="9" width="14" height="1" fill="#f3f4f6" />
    <rect x="1" y="10" width="14" height="1" fill="#f3f4f6" />
    <rect x="1" y="11" width="14" height="1" fill="#f3f4f6" />
    <rect x="2" y="12" width="12" height="1" fill="#f3f4f6" />
    <rect x="3" y="13" width="10" height="1" fill="#f3f4f6" />
    <rect x="5" y="14" width="6" height="1" fill="#f3f4f6" />
    {/* Outline */}
    <rect x="5" y="0" width="6" height="1" fill={color} />
    <rect x="3" y="1" width="2" height="1" fill={color} />
    <rect x="11" y="1" width="2" height="1" fill={color} />
    <rect x="2" y="2" width="1" height="1" fill={color} />
    <rect x="13" y="2" width="1" height="1" fill={color} />
    <rect x="1" y="3" width="1" height="1" fill={color} />
    <rect x="14" y="3" width="1" height="1" fill={color} />
    <rect x="0" y="4" width="1" height="8" fill={color} />
    <rect x="15" y="4" width="1" height="8" fill={color} />
    <rect x="1" y="12" width="1" height="1" fill={color} />
    <rect x="14" y="12" width="1" height="1" fill={color} />
    <rect x="2" y="13" width="1" height="1" fill={color} />
    <rect x="13" y="13" width="1" height="1" fill={color} />
    <rect x="3" y="14" width="2" height="1" fill={color} />
    <rect x="11" y="14" width="2" height="1" fill={color} />
    <rect x="5" y="15" width="6" height="1" fill={color} />
  </svg>
);

export const PixelSwords: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Left sword */}
    <rect x="1" y="1" width="2" height="2" />
    <rect x="3" y="3" width="2" height="2" />
    <rect x="5" y="5" width="2" height="2" />
    <rect x="7" y="7" width="2" height="2" />
    <rect x="2" y="9" width="2" height="2" />
    <rect x="0" y="11" width="2" height="2" />
    <rect x="4" y="11" width="2" height="2" />
    {/* Right sword */}
    <rect x="13" y="1" width="2" height="2" />
    <rect x="11" y="3" width="2" height="2" />
    <rect x="9" y="5" width="2" height="2" />
    <rect x="12" y="9" width="2" height="2" />
    <rect x="14" y="11" width="2" height="2" />
    <rect x="10" y="11" width="2" height="2" />
  </svg>
);

export const PixelCrown: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="0" y="4" width="2" height="2" />
    <rect x="4" y="2" width="2" height="2" />
    <rect x="7" y="0" width="2" height="2" />
    <rect x="10" y="2" width="2" height="2" />
    <rect x="14" y="4" width="2" height="2" />
    <rect x="0" y="6" width="16" height="2" />
    <rect x="1" y="8" width="14" height="6" />
    {/* Gems */}
    <rect x="4" y="10" width="2" height="2" fill="#dc2626" />
    <rect x="7" y="10" width="2" height="2" fill="#2563eb" />
    <rect x="10" y="10" width="2" height="2" fill="#16a34a" />
  </svg>
);

export const PixelCalendar: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Rings */}
    <rect x="4" y="0" width="2" height="3" />
    <rect x="10" y="0" width="2" height="3" />
    {/* Calendar body */}
    <rect x="0" y="2" width="16" height="2" />
    <rect x="0" y="4" width="16" height="12" fillOpacity="0.3" />
    <rect x="0" y="2" width="1" height="14" />
    <rect x="15" y="2" width="1" height="14" />
    <rect x="0" y="15" width="16" height="1" />
    {/* Date dots */}
    <rect x="3" y="7" width="2" height="2" />
    <rect x="7" y="7" width="2" height="2" />
    <rect x="11" y="7" width="2" height="2" />
    <rect x="3" y="11" width="2" height="2" />
    <rect x="7" y="11" width="2" height="2" />
  </svg>
);

export const PixelInfinity: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="2" y="5" width="2" height="1" />
    <rect x="12" y="5" width="2" height="1" />
    <rect x="1" y="6" width="1" height="1" />
    <rect x="4" y="6" width="1" height="1" />
    <rect x="11" y="6" width="1" height="1" />
    <rect x="14" y="6" width="1" height="1" />
    <rect x="0" y="7" width="1" height="2" />
    <rect x="5" y="7" width="1" height="1" />
    <rect x="10" y="7" width="1" height="1" />
    <rect x="15" y="7" width="1" height="2" />
    <rect x="6" y="8" width="4" height="1" />
    <rect x="0" y="9" width="1" height="1" />
    <rect x="5" y="9" width="1" height="1" />
    <rect x="10" y="9" width="1" height="1" />
    <rect x="15" y="9" width="1" height="1" />
    <rect x="1" y="10" width="1" height="1" />
    <rect x="4" y="10" width="1" height="1" />
    <rect x="11" y="10" width="1" height="1" />
    <rect x="14" y="10" width="1" height="1" />
    <rect x="2" y="11" width="2" height="1" />
    <rect x="12" y="11" width="2" height="1" />
  </svg>
);

export const PixelHistory: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Clock circle */}
    <rect x="5" y="0" width="6" height="1" />
    <rect x="3" y="1" width="2" height="1" />
    <rect x="11" y="1" width="2" height="1" />
    <rect x="2" y="2" width="1" height="1" />
    <rect x="13" y="2" width="1" height="1" />
    <rect x="1" y="3" width="1" height="2" />
    <rect x="14" y="3" width="1" height="2" />
    <rect x="0" y="5" width="1" height="6" />
    <rect x="15" y="5" width="1" height="6" />
    <rect x="1" y="11" width="1" height="2" />
    <rect x="14" y="11" width="1" height="2" />
    <rect x="2" y="13" width="1" height="1" />
    <rect x="13" y="13" width="1" height="1" />
    <rect x="3" y="14" width="2" height="1" />
    <rect x="11" y="14" width="2" height="1" />
    <rect x="5" y="15" width="6" height="1" />
    {/* Clock hands */}
    <rect x="7" y="4" width="2" height="4" />
    <rect x="9" y="7" width="3" height="2" />
    {/* Arrow */}
    <rect x="0" y="7" width="3" height="2" />
    <rect x="1" y="5" width="2" height="2" />
    <rect x="1" y="9" width="2" height="2" />
  </svg>
);

export const PixelSun: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Rays */}
    <rect x="7" y="0" width="2" height="2" />
    <rect x="7" y="14" width="2" height="2" />
    <rect x="0" y="7" width="2" height="2" />
    <rect x="14" y="7" width="2" height="2" />
    <rect x="2" y="2" width="2" height="2" />
    <rect x="12" y="2" width="2" height="2" />
    <rect x="2" y="12" width="2" height="2" />
    <rect x="12" y="12" width="2" height="2" />
    {/* Sun center */}
    <rect x="5" y="4" width="6" height="1" />
    <rect x="4" y="5" width="8" height="6" />
    <rect x="5" y="11" width="6" height="1" />
  </svg>
);

export const PixelMoon: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="9" y="1" width="4" height="1" />
    <rect x="7" y="2" width="2" height="1" />
    <rect x="6" y="3" width="1" height="1" />
    <rect x="5" y="4" width="1" height="2" />
    <rect x="4" y="6" width="1" height="4" />
    <rect x="5" y="10" width="1" height="2" />
    <rect x="6" y="12" width="1" height="1" />
    <rect x="7" y="13" width="2" height="1" />
    <rect x="9" y="14" width="4" height="1" />
    <rect x="13" y="2" width="1" height="1" />
    <rect x="14" y="3" width="1" height="2" />
    <rect x="13" y="5" width="1" height="1" />
    <rect x="12" y="6" width="1" height="1" />
    <rect x="11" y="7" width="1" height="2" />
    <rect x="12" y="9" width="1" height="1" />
    <rect x="13" y="10" width="1" height="2" />
    <rect x="14" y="12" width="1" height="1" />
    <rect x="13" y="13" width="1" height="1" />
  </svg>
);

export const PixelUser: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Head */}
    <rect x="5" y="1" width="6" height="1" />
    <rect x="4" y="2" width="8" height="5" />
    <rect x="5" y="7" width="6" height="1" />
    {/* Body */}
    <rect x="3" y="9" width="10" height="1" />
    <rect x="2" y="10" width="12" height="1" />
    <rect x="1" y="11" width="14" height="4" />
  </svg>
);

export const PixelUsers: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Left person */}
    <rect x="2" y="2" width="4" height="1" />
    <rect x="1" y="3" width="6" height="3" />
    <rect x="2" y="6" width="4" height="1" />
    <rect x="0" y="8" width="8" height="1" />
    <rect x="0" y="9" width="8" height="3" />
    {/* Right person */}
    <rect x="10" y="2" width="4" height="1" />
    <rect x="9" y="3" width="6" height="3" />
    <rect x="10" y="6" width="4" height="1" />
    <rect x="8" y="8" width="8" height="1" />
    <rect x="8" y="9" width="8" height="3" />
  </svg>
);

export const PixelInfo: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Circle */}
    <rect x="5" y="0" width="6" height="1" />
    <rect x="3" y="1" width="2" height="1" />
    <rect x="11" y="1" width="2" height="1" />
    <rect x="2" y="2" width="1" height="1" />
    <rect x="13" y="2" width="1" height="1" />
    <rect x="1" y="3" width="1" height="2" />
    <rect x="14" y="3" width="1" height="2" />
    <rect x="0" y="5" width="1" height="6" />
    <rect x="15" y="5" width="1" height="6" />
    <rect x="1" y="11" width="1" height="2" />
    <rect x="14" y="11" width="1" height="2" />
    <rect x="2" y="13" width="1" height="1" />
    <rect x="13" y="13" width="1" height="1" />
    <rect x="3" y="14" width="2" height="1" />
    <rect x="11" y="14" width="2" height="1" />
    <rect x="5" y="15" width="6" height="1" />
    {/* "i" */}
    <rect x="7" y="3" width="2" height="2" />
    <rect x="7" y="6" width="2" height="6" />
  </svg>
);

export const PixelLogout: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Door frame */}
    <rect x="0" y="0" width="2" height="16" />
    <rect x="2" y="0" width="7" height="2" />
    <rect x="2" y="14" width="7" height="2" />
    <rect x="7" y="2" width="2" height="5" />
    <rect x="7" y="9" width="2" height="5" />
    {/* Arrow */}
    <rect x="9" y="7" width="5" height="2" />
    <rect x="12" y="5" width="2" height="2" />
    <rect x="14" y="7" width="2" height="2" />
    <rect x="12" y="9" width="2" height="2" />
  </svg>
);

export const PixelSettings: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Gear teeth */}
    <rect x="6" y="0" width="4" height="2" />
    <rect x="6" y="14" width="4" height="2" />
    <rect x="0" y="6" width="2" height="4" />
    <rect x="14" y="6" width="2" height="4" />
    <rect x="1" y="1" width="3" height="3" />
    <rect x="12" y="1" width="3" height="3" />
    <rect x="1" y="12" width="3" height="3" />
    <rect x="12" y="12" width="3" height="3" />
    {/* Center circle */}
    <rect x="4" y="4" width="8" height="8" />
    <rect x="6" y="6" width="4" height="4" fill="var(--mantine-color-body)" />
  </svg>
);

export const PixelStar: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="7" y="0" width="2" height="2" />
    <rect x="6" y="2" width="4" height="2" />
    <rect x="0" y="4" width="16" height="3" />
    <rect x="2" y="7" width="12" height="2" />
    <rect x="3" y="9" width="10" height="1" />
    <rect x="3" y="10" width="4" height="2" />
    <rect x="9" y="10" width="4" height="2" />
    <rect x="2" y="12" width="3" height="2" />
    <rect x="11" y="12" width="3" height="2" />
    <rect x="1" y="14" width="2" height="2" />
    <rect x="13" y="14" width="2" height="2" />
  </svg>
);

export const PixelChevronLeft: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="10" y="2" width="2" height="2" />
    <rect x="8" y="4" width="2" height="2" />
    <rect x="6" y="6" width="2" height="2" />
    <rect x="4" y="8" width="2" height="0" />
    <rect x="6" y="8" width="2" height="2" />
    <rect x="8" y="10" width="2" height="2" />
    <rect x="10" y="12" width="2" height="2" />
  </svg>
);

export const PixelChevronRight: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="4" y="2" width="2" height="2" />
    <rect x="6" y="4" width="2" height="2" />
    <rect x="8" y="6" width="2" height="2" />
    <rect x="8" y="8" width="2" height="2" />
    <rect x="6" y="10" width="2" height="2" />
    <rect x="4" y="12" width="2" height="2" />
  </svg>
);

export const PixelRefresh: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Arrow head */}
    <rect x="10" y="0" width="2" height="2" />
    <rect x="12" y="2" width="2" height="2" />
    <rect x="14" y="4" width="2" height="2" />
    <rect x="8" y="4" width="6" height="2" />
    {/* Circle */}
    <rect x="5" y="1" width="5" height="2" />
    <rect x="3" y="3" width="2" height="1" />
    <rect x="2" y="4" width="1" height="2" />
    <rect x="1" y="6" width="1" height="4" />
    <rect x="2" y="10" width="1" height="2" />
    <rect x="3" y="12" width="2" height="1" />
    <rect x="5" y="13" width="6" height="2" />
    <rect x="11" y="12" width="2" height="1" />
    <rect x="13" y="10" width="1" height="2" />
    <rect x="14" y="8" width="1" height="2" />
  </svg>
);

export const PixelPlay: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="3" y="1" width="2" height="14" />
    <rect x="5" y="2" width="2" height="12" />
    <rect x="7" y="3" width="2" height="10" />
    <rect x="9" y="4" width="2" height="8" />
    <rect x="11" y="5" width="2" height="6" />
    <rect x="13" y="6" width="2" height="4" />
  </svg>
);

export const PixelCheck: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="1" y="7" width="2" height="2" />
    <rect x="3" y="9" width="2" height="2" />
    <rect x="5" y="11" width="2" height="2" />
    <rect x="7" y="9" width="2" height="2" />
    <rect x="9" y="7" width="2" height="2" />
    <rect x="11" y="5" width="2" height="2" />
    <rect x="13" y="3" width="2" height="2" />
  </svg>
);

export const PixelX: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="2" y="2" width="2" height="2" />
    <rect x="12" y="2" width="2" height="2" />
    <rect x="4" y="4" width="2" height="2" />
    <rect x="10" y="4" width="2" height="2" />
    <rect x="6" y="6" width="4" height="4" />
    <rect x="4" y="10" width="2" height="2" />
    <rect x="10" y="10" width="2" height="2" />
    <rect x="2" y="12" width="2" height="2" />
    <rect x="12" y="12" width="2" height="2" />
  </svg>
);

export const PixelShield: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="1" y="0" width="14" height="2" />
    <rect x="0" y="2" width="16" height="8" />
    <rect x="1" y="10" width="14" height="2" />
    <rect x="2" y="12" width="12" height="1" />
    <rect x="4" y="13" width="8" height="1" />
    <rect x="6" y="14" width="4" height="1" />
    <rect x="7" y="15" width="2" height="1" />
  </svg>
);

export const PixelHeart: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="2" y="2" width="4" height="2" />
    <rect x="10" y="2" width="4" height="2" />
    <rect x="1" y="4" width="6" height="4" />
    <rect x="9" y="4" width="6" height="4" />
    <rect x="1" y="8" width="14" height="2" />
    <rect x="2" y="10" width="12" height="2" />
    <rect x="4" y="12" width="8" height="1" />
    <rect x="5" y="13" width="6" height="1" />
    <rect x="6" y="14" width="4" height="1" />
    <rect x="7" y="15" width="2" height="1" />
  </svg>
);

export const PixelBolt: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    <rect x="8" y="0" width="4" height="2" />
    <rect x="6" y="2" width="4" height="2" />
    <rect x="4" y="4" width="4" height="2" />
    <rect x="2" y="6" width="10" height="2" />
    <rect x="6" y="8" width="4" height="2" />
    <rect x="8" y="10" width="4" height="2" />
    <rect x="6" y="12" width="4" height="2" />
    <rect x="4" y="14" width="4" height="2" />
  </svg>
);

export const PixelFlask: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Flask neck */}
    <rect x="6" y="0" width="4" height="1" />
    <rect x="5" y="1" width="6" height="1" />
    <rect x="6" y="2" width="4" height="3" />
    {/* Flask body */}
    <rect x="4" y="5" width="2" height="1" />
    <rect x="10" y="5" width="2" height="1" />
    <rect x="3" y="6" width="2" height="1" />
    <rect x="11" y="6" width="2" height="1" />
    <rect x="2" y="7" width="2" height="2" />
    <rect x="12" y="7" width="2" height="2" />
    <rect x="1" y="9" width="2" height="3" />
    <rect x="13" y="9" width="2" height="3" />
    <rect x="1" y="12" width="14" height="1" />
    <rect x="2" y="13" width="12" height="1" />
    <rect x="3" y="14" width="10" height="1" />
    <rect x="4" y="15" width="8" height="1" />
    {/* Bubbles inside */}
    <rect x="5" y="10" width="2" height="2" fill="#3b82f6" />
    <rect x="8" y="11" width="2" height="2" fill="#3b82f6" />
    <rect x="10" y="9" width="2" height="2" fill="#3b82f6" />
  </svg>
);

export const PixelAdmin: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Shield with gear */}
    <rect x="3" y="0" width="10" height="1" />
    <rect x="2" y="1" width="12" height="1" />
    <rect x="1" y="2" width="14" height="8" />
    <rect x="2" y="10" width="12" height="1" />
    <rect x="3" y="11" width="10" height="1" />
    <rect x="4" y="12" width="8" height="1" />
    <rect x="5" y="13" width="6" height="1" />
    <rect x="6" y="14" width="4" height="1" />
    <rect x="7" y="15" width="2" height="1" />
    {/* Gear in center */}
    <rect x="7" y="3" width="2" height="1" fill="#dc2626" />
    <rect x="7" y="8" width="2" height="1" fill="#dc2626" />
    <rect x="4" y="5" width="1" height="2" fill="#dc2626" />
    <rect x="11" y="5" width="1" height="2" fill="#dc2626" />
    <rect x="5" y="4" width="6" height="4" fill="#dc2626" />
    <rect x="6" y="5" width="4" height="2" fill="var(--mantine-color-body)" />
  </svg>
);

export const PixelCards: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Back card */}
    <rect x="0" y="0" width="10" height="1" />
    <rect x="0" y="1" width="1" height="12" />
    <rect x="10" y="0" width="1" height="10" />
    <rect x="0" y="13" width="8" height="1" />
    {/* Front card */}
    <rect x="5" y="3" width="10" height="1" />
    <rect x="5" y="4" width="1" height="11" />
    <rect x="15" y="3" width="1" height="12" />
    <rect x="5" y="15" width="11" height="1" />
    {/* Card content - Pokemon silhouette */}
    <rect x="8" y="6" width="4" height="1" />
    <rect x="7" y="7" width="6" height="3" />
    <rect x="8" y="10" width="4" height="2" />
    {/* Decorative lines */}
    <rect x="7" y="13" width="6" height="1" />
  </svg>
);

export const PixelGlobe: React.FC<PixelIconProps> = ({
  size = 16,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ ...baseStyle, ...style }}
  >
    {/* Globe outline */}
    <rect x="5" y="0" width="6" height="1" />
    <rect x="3" y="1" width="2" height="1" />
    <rect x="11" y="1" width="2" height="1" />
    <rect x="2" y="2" width="1" height="1" />
    <rect x="13" y="2" width="1" height="1" />
    <rect x="1" y="3" width="1" height="3" />
    <rect x="14" y="3" width="1" height="3" />
    <rect x="0" y="6" width="1" height="4" />
    <rect x="15" y="6" width="1" height="4" />
    <rect x="1" y="10" width="1" height="3" />
    <rect x="14" y="10" width="1" height="3" />
    <rect x="2" y="13" width="1" height="1" />
    <rect x="13" y="13" width="1" height="1" />
    <rect x="3" y="14" width="2" height="1" />
    <rect x="11" y="14" width="2" height="1" />
    <rect x="5" y="15" width="6" height="1" />
    {/* Horizontal line */}
    <rect x="1" y="7" width="14" height="1" />
    <rect x="1" y="8" width="14" height="1" />
    {/* Vertical meridian */}
    <rect x="7" y="1" width="2" height="5" />
    <rect x="7" y="9" width="2" height="5" />
    {/* Connection dots */}
    <rect x="4" y="4" width="1" height="1" />
    <rect x="11" y="4" width="1" height="1" />
    <rect x="4" y="11" width="1" height="1" />
    <rect x="11" y="11" width="1" height="1" />
  </svg>
);

// Export all icons as a collection for easy mapping
export const PixelIcons = {
  pokeball: PixelPokeball,
  swords: PixelSwords,
  crown: PixelCrown,
  calendar: PixelCalendar,
  infinity: PixelInfinity,
  history: PixelHistory,
  sun: PixelSun,
  moon: PixelMoon,
  user: PixelUser,
  users: PixelUsers,
  info: PixelInfo,
  logout: PixelLogout,
  settings: PixelSettings,
  star: PixelStar,
  chevronLeft: PixelChevronLeft,
  chevronRight: PixelChevronRight,
  refresh: PixelRefresh,
  play: PixelPlay,
  check: PixelCheck,
  x: PixelX,
  shield: PixelShield,
  heart: PixelHeart,
  bolt: PixelBolt,
  flask: PixelFlask,
  admin: PixelAdmin,
  cards: PixelCards,
  globe: PixelGlobe,
};
