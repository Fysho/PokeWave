import React from 'react';
import { Box, useMantineTheme } from '@mantine/core';
import { getTypeColor } from '../../utils/typeColors';

interface TypeColorSliderProps {
  value: number;
  onChange: (value: number) => void;
  leftType: string;
  rightType: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  correctValue?: number;
  showCorrectIndicator?: boolean;
}

export const TypeColorSlider: React.FC<TypeColorSliderProps> = ({
  value,
  onChange,
  leftType,
  rightType,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  correctValue,
  showCorrectIndicator = false,
}) => {
  const theme = useMantineTheme();
  
  const leftColor = getTypeColor(leftType);
  const rightColor = getTypeColor(rightType);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const sliderElement = e.currentTarget;
    
    const updateValue = (clientX: number) => {
      const rect = sliderElement.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round(percentage * (max - min) + min);
      onChange(newValue);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientX);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    updateValue(e.clientX);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const percentage = ((value - min) / (max - min)) * 100;
  const correctPercentage = correctValue !== undefined ? ((correctValue - min) / (max - min)) * 100 : 0;
  
  return (
    <Box
      style={{
        position: 'relative',
        height: '10px',
        borderRadius: '5px',
        background: `linear-gradient(to right, ${leftColor} 0%, ${leftColor} ${percentage}%, ${rightColor} ${percentage}%, ${rightColor} 100%)`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Track overlay for better visibility */}
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '3px',
          right: '3px',
          height: '8px',
          transform: 'translateY(-50%)',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Thumb */}
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: `${percentage}%`,
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: theme.white,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Correct Answer Indicator */}
      {showCorrectIndicator && correctValue !== undefined && (
        <>
          {/* Arrow pointing down */}
          <Box
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${correctPercentage}%`,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '12px solid #e74c3c',
              pointerEvents: 'none',
            }}
          />
          {/* Arrow stem */}
          <Box
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${correctPercentage}%`,
              transform: 'translateX(-50%)',
              width: '2px',
              height: '15px',
              background: '#e74c3c',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </Box>
  );
};