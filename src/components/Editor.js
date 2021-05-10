
import React from "react";
import Monaco from "@monaco-editor/react";
import "./Editor.less"

export class Editor extends React.Component {
 
  render() {
    const {app} = this.props;
    return (
        <Monaco
          height="100%"
          theme="vs-light"
          defaultValue={app.source}
          defaultLanguage="tunecraft"
          onChange={app.editor.onChange}
          beforeMount={app.editor.willMount}
          onMount={app.editor.didMount}
					options={{minimap:{enabled:false}}}
          />
    )
  }
}

