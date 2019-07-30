import React from 'react';
import AceEditor from 'react-ace';

import 'brace/mode/python';
import 'brace/theme/textmate';

function Editor({
  // eslint-disable-next-line react/prop-types
  annotations,
  // eslint-disable-next-line react/prop-types
  initialCode,
  // eslint-disable-next-line react/prop-types
  onChange,
  // eslint-disable-next-line react/prop-types
  code,
}) {
  return (
    <AceEditor
      name="editor"
      mode="python"
      theme="textmate"
      fontSize={14}
      annotations={annotations}
      onChange={onChange}
      defaultValue={initialCode}
      value={code}
      width="auto"
      height="auto"
      editorProps={{
        $blockScrolling: true,
      }}
    />
  );
}

export default Editor;
