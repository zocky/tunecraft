
import React from "react";
import MonacoEditor from "react-monaco-editor";
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
        <CodeEditor />
        <EditorInspector />
        <EditorStatus />
      </div>
    )
  }
}


export class CodeEditor extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    return (
      <div className="tc monaco">
        <MonacoEditor
          height="100%"
          theme="vs-light"
          defaultValue={app.source}
          language="tunecraft"
          onChange={app.editor.onChange}
          editorWillMount={app.editor.willMount}
          editorDidMount={app.editor.didMount}
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
      <div className="tc inspector">
      <table title={JSON.stringify(note, null, 2)}>
        <tbody>
          <tr>
            <th>Track</th><td colSpan={2}>{note.track}</td>
          </tr>
          <tr>
            <th>Pitch</th>
            <td>{pitchToText(note.note)}</td>
            <td>{note.note}</td>
          </tr>
          <tr>
            <th>Length</th>
            <td>{ticksToText(note.ticks)}</td>
            <td>{note.ticks}T</td>
          </tr>          
          <tr>
            <th>Bar</th>
            <td>{note.bar}</td>
          </tr>
          <tr>
            <th>Time</th>
            <td>{note.at.toFixed(2)}s</td>
            <td>{note.tick}T</td>
          </tr>
          
          <tr>
            <th>Call stack</th>
            <td colSpan={2}>
              {note.callStack.map((location,i)=><a key={i} onClick={()=>{
                console.log(location);
                app.editor.selectLocation(location)
              }}>{location.start.line} </a>).reverse()}
            </td>
            
          </tr>
        </tbody>
      </table>
      </div>
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
