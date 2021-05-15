
import React from "react";
import Monaco from "@monaco-editor/react";
import "./Editor.less"
import { observer } from "mobx-react";
import { AppContext } from "./Utils";
import { pitchToText } from "../lib/utils";

@observer
export class Editor extends React.Component {
  static contextType = AppContext;
  render() {
    return (
      <div className="tc editor">
        <MonacoEditor />
        <EditorInspector />
        <EditorStatus />
      </div>
    )
  }
}


export class MonacoEditor extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    return (
      <div className="tc monaco">
        <Monaco
          height="100%"
          theme="vs-light"
          defaultValue={app.source}
          defaultLanguage="tunecraft"
          onChange={app.editor.onChange}
          beforeMount={app.editor.willMount}
          onMount={app.editor.didMount}
          options={{ minimap: { enabled: false }, fontFamily: "Ubuntu Mono", fontSize:"18" }}
        />
      </div>
    )
  }
}

@observer
export class EditorStatus extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    return (
      <div className="tc status">
        <div className="message">
          {app.error?.message ?? "OK"}
        </div>
      </div>
    )
  }
}


@observer
export class EditorInspector extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    const note = app.selectedNote;
    if (!note) return null;
    return (
      <table className="tc inspector" title={JSON.stringify(note, null, 2)}>
        <tbody>
          <tr>
            <th>Track</th><td>{note.track}</td>
          </tr>
          <tr>
            <th>Pitch</th><td>{pitchToText(note.note)} ({note.note})</td>
          </tr>
          <tr>
            <th>Length</th><td>{ticksToText(note.ticks)} ({note.ticks})</td>
          </tr>
          <tr>
            <th>Bar</th><td>{note.bar}</td>
          </tr>
        </tbody>
      </table>
    )
  }
}


function ticksToText(ticks, TPQ = 96) {
  function gcd(a, b) {
    if (b < 1) return a;
    return gcd(0 | b, 0 | (a % b));
  };
  let whole = TPQ * 4;
  let d = gcd(ticks, whole);
  return (0 | (ticks / d)) + "/" + (0 | (whole / d))
}
