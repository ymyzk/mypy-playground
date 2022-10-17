import { Ace } from 'ace-builds';
import dynamic from 'next/dynamic';
import React from 'react';

import styles from './Editor.module.css';

// Disable SSR as AceEditor needs "window"
const AceEditor = dynamic(async () => {
    const ace = await import('react-ace');
    await import('ace-builds/src-noconflict/mode-python');
    await import('ace-builds/src-noconflict/theme-textmate');
    return ace
  },
  { ssr: false }
);

type Props = {
  annotations: Ace.Annotation[],
  onChange: any,
  source: string,
}

function Editor({
  annotations,
  onChange,
  source,
}: Props): JSX.Element {
  return (
      <div className={styles.editor}>
          <AceEditor
              name="editor"
              mode="python"
              theme="textmate"
              fontSize={14}
              annotations={annotations}
              onChange={onChange}
              value={source}
              width="100%"
              height="100%"
              editorProps={{
                  $blockScrolling: true,
              }}
          />
      </div>
  );
}

export default Editor;
