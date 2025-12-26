import React from 'react';
import { cn } from '@/lib/utils';

interface TextBlockWidgetProps {
  text?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  textColor?: string;
  verticalPadding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

const fontSizeClasses = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl'
};

const fontWeightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold'
};

const textAlignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

const verticalPaddingClasses = {
  none: 'py-0',
  xs: 'py-1',
  sm: 'py-2',
  md: 'py-4',
  lg: 'py-6'
};

export function TextBlockWidget({
  text = 'Digite seu texto aqui',
  textAlign = 'left',
  fontSize = 'lg',
  fontWeight = 'semibold',
  textColor,
  verticalPadding = 'sm'
}: TextBlockWidgetProps) {
  return (
    <div className={cn(
      "h-full w-full flex items-center px-4 glass-card rounded-lg",
      verticalPaddingClasses[verticalPadding]
    )}>
      <p 
        className={cn(
          "w-full leading-relaxed",
          fontSizeClasses[fontSize],
          fontWeightClasses[fontWeight],
          textAlignClasses[textAlign],
          !textColor && "text-foreground"
        )}
        style={textColor ? { color: textColor } : undefined}
      >
        {text}
      </p>
    </div>
  );
}
