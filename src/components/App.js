
import React from "react";
import { observer } from "mobx-react";
import "./App.less";

import {Draggable, AppContext } from "./Utils.js";
import { Viewer } from "./Viewer";
import { Editor } from "./Editor";

@observer
export class App extends React.Component {
  componentDidMount() {
    window.addEventListener('wheel', e => e.ctrlKey && e.preventDefault(), { passive: false, capture:true });
  }
  render() {
    const { app } = this.props;

    return (
      <AppContext.Provider value={{app}}>
      <div className="tc app">
        <MainView app={app}/>
      </div>
      </AppContext.Provider>
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
        </div>
      </>
    )
  }
}