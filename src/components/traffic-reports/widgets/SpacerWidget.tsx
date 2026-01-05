import React from 'react';

interface SpacerWidgetProps {
  showGuide?: boolean;
}

export function SpacerWidget({ showGuide = false }: SpacerWidgetProps) {
  // Spacer é invisível no relatório final
  // No editor, mostra um guia visual
  if (showGuide) {
    return (
      <div className="h-full w-full flex items-center justify-center border border-dashed border-border/30 rounded-lg bg-muted/10">
        <span className="text-xs text-muted-foreground/50">Espaçador</span>
      </div>
    );
  }

  return <div className="h-full w-full" />;
}
