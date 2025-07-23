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
  isCorrect?: boolean;
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
  isCorrect = false,
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
        height: '12px',
        borderRadius: '6px',
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
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: theme.white,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Tolerance Range Indicators - Always based on user's guess value */}
      <>
        {/* Left range indicator */}
        {(() => {
          let leftPosition: number;
          if (percentage < 10) {
            leftPosition = 0; // Would be at 0%
          } else if (percentage > 90) {
            leftPosition = 80; // Would be at 80%
          } else {
            leftPosition = percentage - 10; // Normal case
          }
          
          // Only show if not at 0%
          return leftPosition > 0 ? (
            <Box
              style={{
                position: 'absolute',
                top: '-8px',
                left: `${leftPosition}%`,
                width: '2px',
                height: '28px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            />
          ) : null;
        })()}
        
        {/* Right range indicator */}
        {(() => {
          let rightPosition: number;
          if (percentage < 10) {
            rightPosition = 20; // Would be at 20%
          } else if (percentage > 90) {
            rightPosition = 100; // Would be at 100%
          } else {
            rightPosition = percentage + 10; // Normal case
          }
          
          // Only show if not at 100%
          return rightPosition < 100 ? (
            <Box
              style={{
                position: 'absolute',
                top: '-8px',
                left: `${rightPosition}%`,
                width: '2px',
                height: '28px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            />
          ) : null;
        })()}
      </>
      
      {/* Correct Answer Indicator - Show after submission */}
      {showCorrectIndicator && correctValue !== undefined && (
        <Box
          style={{
            position: 'absolute',
            top: '-14px',
            left: `${correctPercentage}%`,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `12px solid ${isCorrect ? '#27ae60' : '#e74c3c'}`,
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
};