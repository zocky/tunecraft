
import React from "react";
import Monaco from "@monaco-editor/react";
import "./Editor.less"
import { observer } from "mobx-react";

@observer
export class Editor extends React.Component {
 
  render() {
    const {app} = this.props;
    return (
      <div className="tc editor">
        <MonacoEditor app={app}/>
        <EditorStatus app={app}/>
      </div>
    )
  }
}


export class MonacoEditor extends React.Component {
 
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

@observer
export class EditorStatus extends React.Component {
  render() {
    const {app} = this.props;
    return (
      <div className="tc status">
        <div className="message">
          {app.error?.message ?? "OK"}
        </div>
      </div>
    )
  }
}
