import dynamic from 'next/dynamic';
import React from 'react';
// Disable SSR as AceEditor needs "window"
const AceEditor = dynamic(async () => {
    const ace = await import('react-ace');
    await import('ace-builds/src-noconflict/mode-python');
    await import('ace-builds/src-noconflict/theme-textmate');
    return ace
  },
  { ssr: false }
);

function Editor({
  annotations,
  onChange,
  source,
}) {
  return (
    <AceEditor
      name="editor"
      mode="python"
      theme="textmate"
      fontSize={14}
      annotations={annotations}
      onChange={onChange}
      value={source}
      width="auto"
      height="auto"
      editorProps={{
        $blockScrolling: true,
      }}
    />
  );
}

export default Editor;
