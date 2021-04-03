import React from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-textmate';

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
