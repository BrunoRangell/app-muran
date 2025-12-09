import { Suspense } from 'react';
import { TemplateEditor } from '@/components/template-editor/TemplateEditor';

const TemplateEditorPage = () => {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando editor...</div>
      </div>
    }>
      <TemplateEditor />
    </Suspense>
  );
};

export default TemplateEditorPage;
