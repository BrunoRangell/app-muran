import React from 'react';
import { cn } from '@/lib/utils';

interface DividerWidgetProps {
  dividerStyle?: 'solid' | 'dashed' | 'dotted' | 'gradient';
  dividerColor?: string;
  dividerThickness?: number;
}

export function DividerWidget({
  dividerStyle = 'solid',
  dividerColor = 'hsl(var(--border))',
  dividerThickness = 1
}: DividerWidgetProps) {
  if (dividerStyle === 'gradient') {
    return (
      <div className="h-full w-full flex items-center px-4">
        <div 
          className="w-full rounded-full"
          style={{
            height: `${dividerThickness}px`,
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)'
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center px-4">
      <hr 
        className="w-full"
        style={{
          borderTopWidth: `${dividerThickness}px`,
          borderTopStyle: dividerStyle,
          borderTopColor: dividerColor
        }}
      />
    </div>
  );
}
