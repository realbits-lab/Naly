'use server';

import { runReporter } from '@/lib/agents/reporter';
import { runEditor } from '@/lib/agents/editor';
import { runDesigner } from '@/lib/agents/designer';
import { runMarketer } from '@/lib/agents/marketer';
import { ReporterInput } from '@/lib/agents/types';

export async function generateContent(input: ReporterInput) {
  // 1. Reporter
  const reporterOutput = await runReporter(input);

  // 2. Editor
  const editorOutput = await runEditor({ originalContent: reporterOutput });

  // 3. Designer
  const designerOutput = await runDesigner({ content: editorOutput });

  // 4. Marketer
  const marketerOutput = await runMarketer({ content: editorOutput, assets: designerOutput });

  return {
    reporter: reporterOutput,
    editor: editorOutput,
    designer: designerOutput,
    marketer: marketerOutput,
  };
}
