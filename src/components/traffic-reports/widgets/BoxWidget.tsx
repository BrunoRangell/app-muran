import React from 'react';
import { cn } from '@/lib/utils';

interface BoxWidgetProps {
  text?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  textColor?: string;
}

const borderRadiusClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6'
};

const textAlignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

const fontSizeClasses = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const fontWeightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold'
};

export function BoxWidget({
  text,
  backgroundColor = 'hsl(var(--primary) / 0.05)',
  borderColor,
  borderRadius = 'lg',
  padding = 'md',
  textAlign = 'left',
  fontSize = 'base',
  fontWeight = 'normal',
  textColor
}: BoxWidgetProps) {
  return (
    <div 
      className={cn(
        "h-full w-full flex items-center",
        borderRadiusClasses[borderRadius],
        paddingClasses[padding],
        borderColor && "border"
      )}
      style={{
        backgroundColor,
        borderColor: borderColor || undefined
      }}
    >
      {text && (
        <p 
          className={cn(
            "w-full",
            textAlignClasses[textAlign],
            fontSizeClasses[fontSize],
            fontWeightClasses[fontWeight],
            !textColor && "text-foreground"
          )}
          style={textColor ? { color: textColor } : undefined}
        >
          {text}
        </p>
      )}
    </div>
  );
}
