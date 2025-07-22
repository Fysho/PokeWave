import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useMantineTheme, useMantineColorScheme } from '@mantine/core';

interface CenterDraggableRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: (value: number) => string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hideHandles?: boolean;
  disableIndividualDrag?: boolean;
}

export const CenterDraggableRangeSlider: React.FC<CenterDraggableRangeSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label = (val) => `${val}%`,
  color = 'blue',
  size = 'md',
  hideHandles = false,
  disableIndividualDrag = false,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'center' | null>(null);
  const [showTooltip, setShowTooltip] = useState<'left' | 'right' | 'both' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const sizeMap = {
    xs: { height: 4, thumbSize: 12 },
    sm: { height: 6, thumbSize: 16 },
    md: { height: 8, thumbSize: 20 },
    lg: { height: 10, thumbSize: 24 },
    xl: { height: 12, thumbSize: 28 },
  };

  const { height, thumbSize } = sizeMap[size];

  const getPositionFromValue = (val: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = percent * (max - min) + min;
    return Math.round(rawValue / step) * step;
  };

  const handleMouseDown = (e: React.MouseEvent, handle: 'left' | 'right' | 'center') => {
    if (disabled) return;
    if (disableIndividualDrag && handle !== 'center') return;
    e.preventDefault();
    setIsDragging(handle);
    setShowTooltip(handle === 'center' ? 'both' : handle);
  };

  const handleTouchStart = (e: React.TouchEvent, handle: 'left' | 'right' | 'center') => {
    if (disabled) return;
    if (disableIndividualDrag && handle !== 'center') return;
    e.preventDefault();
    setIsDragging(handle);
    setShowTooltip(handle === 'center' ? 'both' : handle);
  };

  const updateValue = (newValue: number) => {
    const [currentMin, currentMax] = localValue;

    if (isDragging === 'left') {
      const newMin = Math.min(newValue, currentMax - step);
      setLocalValue([newMin, currentMax]);
      onChange([newMin, currentMax]);
    } else if (isDragging === 'right') {
      const newMax = Math.max(newValue, currentMin + step);
      setLocalValue([currentMin, newMax]);
      onChange([currentMin, newMax]);
    } else if (isDragging === 'center') {
      const range = currentMax - currentMin;
      const center = newValue;
      let newMin = center - range / 2;
      let newMax = center + range / 2;

      // Ensure we don't go out of bounds
      if (newMin < min) {
        newMin = min;
        newMax = min + range;
      } else if (newMax > max) {
        newMax = max;
        newMin = max - range;
      }

      setLocalValue([Math.round(newMin), Math.round(newMax)]);
      onChange([Math.round(newMin), Math.round(newMax)]);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || disabled) return;
    const newValue = getValueFromPosition(e.clientX);
    updateValue(newValue);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || disabled) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newValue = getValueFromPosition(touch.clientX);
    updateValue(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setShowTooltip(null);
  };

  const handleTouchEnd = () => {
    setIsDragging(null);
    setShowTooltip(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, localValue]);

  const leftPos = getPositionFromValue(localValue[0]);
  const rightPos = getPositionFromValue(localValue[1]);
  const rangeWidth = rightPos - leftPos;

  const getColor = (opacity = 1) => {
    const colors = theme.colors[color];
    return colorScheme === 'dark' ? colors[6] : colors[5];
  };

  const trackColor = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  const thumbColor = getColor();
  const rangeColor = getColor();

  return (
    <Box style={{ position: 'relative', padding: '20px 0' }}>
      {/* Track */}
      <Box
        ref={sliderRef}
        style={{
          position: 'relative',
          height: `${height}px`,
          backgroundColor: trackColor,
          borderRadius: `${height / 2}px`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          border: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[4]}`,
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Active range */}
        <Box
          style={{
            position: 'absolute',
            left: `${leftPos}%`,
            width: `${rangeWidth}%`,
            height: '100%',
            backgroundColor: rangeColor,
            borderRadius: `${height / 2}px`,
          }}
        />

        {/* Center handle (invisible but draggable) */}
        <Box
          onMouseDown={(e) => handleMouseDown(e, 'center')}
          onTouchStart={(e) => handleTouchStart(e, 'center')}
          style={{
            position: 'absolute',
            left: `${leftPos}%`,
            width: `${rangeWidth}%`,
            height: `${thumbSize}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: disabled ? 'not-allowed' : 'grab',
            zIndex: 1,
          }}
        />

        {/* Left thumb */}
        {!hideHandles && (
          <Box
            onMouseDown={(e) => handleMouseDown(e, 'left')}
            onTouchStart={(e) => handleTouchStart(e, 'left')}
            style={{
              position: 'absolute',
              left: `${leftPos}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${thumbSize}px`,
              height: `${thumbSize}px`,
              backgroundColor: thumbColor,
              borderRadius: '50%',
              border: `2px solid ${colorScheme === 'dark' ? theme.colors.dark[0] : theme.white}`,
              cursor: disabled || disableIndividualDrag ? 'not-allowed' : 'grab',
              boxShadow: theme.shadows.sm,
              zIndex: 2,
              transition: isDragging === 'left' ? 'none' : 'box-shadow 0.1s',
              ...(isDragging === 'left' && {
                boxShadow: theme.shadows.md,
                transform: 'translate(-50%, -50%) scale(1.1)',
              }),
            }}
          />
        )}

        {/* Right thumb */}
        {!hideHandles && (
          <Box
            onMouseDown={(e) => handleMouseDown(e, 'right')}
            onTouchStart={(e) => handleTouchStart(e, 'right')}
            style={{
              position: 'absolute',
              left: `${rightPos}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${thumbSize}px`,
              height: `${thumbSize}px`,
              backgroundColor: thumbColor,
              borderRadius: '50%',
              border: `2px solid ${colorScheme === 'dark' ? theme.colors.dark[0] : theme.white}`,
              cursor: disabled || disableIndividualDrag ? 'not-allowed' : 'grab',
              boxShadow: theme.shadows.sm,
              zIndex: 2,
              transition: isDragging === 'right' ? 'none' : 'box-shadow 0.1s',
              ...(isDragging === 'right' && {
                boxShadow: theme.shadows.md,
                transform: 'translate(-50%, -50%) scale(1.1)',
              }),
            }}
          />
        )}

        {/* Tooltips */}
        {(showTooltip === 'left' || showTooltip === 'both') && (
          <Box
            style={{
              position: 'absolute',
              left: `${leftPos}%`,
              bottom: `${thumbSize + 8}px`,
              transform: 'translateX(-50%)',
              backgroundColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[8],
              color: theme.white,
              padding: '4px 8px',
              borderRadius: theme.radius.sm,
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            {label(localValue[0])}
          </Box>
        )}

        {(showTooltip === 'right' || showTooltip === 'both') && (
          <Box
            style={{
              position: 'absolute',
              left: `${rightPos}%`,
              bottom: `${thumbSize + 8}px`,
              transform: 'translateX(-50%)',
              backgroundColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[8],
              color: theme.white,
              padding: '4px 8px',
              borderRadius: theme.radius.sm,
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            {label(localValue[1])}
          </Box>
        )}
      </Box>

      {/* Range indicator text */}
      <Text
        size="sm"
        c="dimmed"
        ta="center"
        mt="xs"
        style={{ userSelect: 'none' }}
      >
        Range: {localValue[1] - localValue[0]}%
      </Text>
    </Box>
  );
};