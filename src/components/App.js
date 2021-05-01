
import React from "react";
import {observer} from "mobx-react";
import {action, computed, makeObservable} from "mobx";
import "./App.less";

import {Editor} from "./Editor";
import {Player} from "./Player";
import {Tracks} from "./Tracks";



@observer
export class App extends React.Component {
  render() {
    const { app } = this.props;
		
    return (
      <div className="tc app">
        <div className="player">
          <Player app={app}/>
        </div>
        <div className="editor">
          <Editor app={app}/>
        </div>
				<div className="status">
					<Status app={app}/>
				</div>
        <div className="viewer">
          <Output app={app}/>
        </div>
      </div>
    )
  }
}


@observer
export class Output extends React.Component {
  render() {
    const {app} = this.props;
    switch (app.viewerMode) {
    case 'tracks':
      return <Tracks app={app}/>
    case 'result':
      return <pre>{JSON.stringify(app.parsed||"",null,2)}</pre>
    }
  }
}


@observer
export class Status extends React.Component {
  render() {
    const {app} = this.props;

    if (app.error) {
      return <code>
        <span>{app.error.location.start.line}:{app.error.location.start.column}</span>
        {" "}
        {app.error.message}
      </code>
    }
    return (
      	<code>Parsed {app.source.length} chars. OK.</code>
    )
  }
}
