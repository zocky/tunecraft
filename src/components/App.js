
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
import "./App.less";

import { Editor } from "./Editor";
import { Player } from "./Player";
import { Tracks } from "./Tracks";

import {Draggable} from "./Utils";
import { Viewer } from "./Viewer";


@observer
export class App extends React.Component {
  componentDidMount() {
    window.addEventListener('wheel', e => e.ctrlKey && e.preventDefault(), { passive: false, capture:true });
  }
  render() {
    const { app } = this.props;

    return (
      <div className="tc app" style={{
        "--tc-view-top": -app.viewTop+'px',
        "--tc-view-left": -app.viewLeft+'px'
      }}>
        <MainView app={app}/>
      </div>
    )
  }
}


@observer
export class MainView extends React.Component {
  render() {
    const { app } = this.props;

    return (
      <>
        <div className="left">
          <Viewer app={app} />
        </div>
        <Draggable
          className="tc splitter"
          onDrag={e => {
            app.editorWidth -= e.movementX
          }} />
        <div className="right" style={{ width: app.editorWidth }}>
          <Editor app={app} />
          <Status app={app} />
        </div>
      </>
    )
  }
}



@observer
export class Output extends React.Component {
  render() {
    const { app } = this.props;
    switch (app.viewerMode) {
      case 'tracks':
        return <Viewer app={app} />
      case 'result':
        return <pre className="tc json">{JSON.stringify([app.tune?.tempoTrack.tickOffsets, app.tune?.events], null, 2)}</pre>
    }
  }
}


@observer
export class Status extends React.Component {
  render() {
    const { app } = this.props;

    if (app.error) {
      return <code>
        <span>{app.error.location?.start.line}:{app.error.location?.start.column}</span>
        {" "}
        {app.error.message}
      </code>
    }
    return (
      <code>Parsed {app.source.length} chars. OK.</code>
    )
  }
}
