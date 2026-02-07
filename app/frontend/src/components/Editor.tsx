import type { Ace } from "ace-builds";
import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";

import styles from "./Editor.module.css";

type Props = {
  annotations: Ace.Annotation[];
  onChange: (value: string) => void;
  source: string;
};

function Editor({ annotations, onChange, source }: Props): React.JSX.Element {
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
