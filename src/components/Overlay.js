
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
//import "./Tracks.less";
import { AppContext, Draggable, onResize, onWheel, Wheelable } from "./Utils";
import { handleMouse, MOUSE } from "../lib/utils";


@observer
export class Overlay extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    return (
      <div className="tc overlay" style={{ left: -app.viewLeft }}>
        <OverlayContent />
      </div>
    )
  }
}

@observer
export class OverlayContent extends React.Component {
  static contextType = AppContext;

  render() {
    const { app } = this.context;
    console.log('render', this.constructor.name)
    return (
      <div className="overlay"
        ref={ref => this.ref = ref}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        onMouseLeave={action(e => {
          app.mouseLeave();
        })}
      >

        <LoopRegion app={app} />
        <MouseCursor app={app} />
        <SeekCursor app={app} />
      </div>
    )
  }

  onMouseDown = handleMouse({
    [MOUSE.LEFT]: e => {
      const { app } = this.context;
      app.player.hold();
      app.player.seek(app.mouseTime);
    },
    [MOUSE.CTRL_LEFT]: e => {
      const { app } = this.context;
      const note = app.mouseNote;
      if (!note) {
        app.selectedNote = null;
        app.highlightedNotes = null;
      }
      else {
        app.selectedNote=note;
        app.player.playSingleNote(note);
        app.highlightedNotes = app.tune.events.filter(e=>e.position===note.position);
      }
    }
  })

  onMouseUp = handleMouse({
    [MOUSE.LEFT]: e => {
      const { app } = this.context;
      app.player.unhold();
    }
  })

  onMouseMove = handleMouse({
    before: e => {
      const { app } = this.context;
      const rect = this.ref.getBoundingClientRect();
      const x = e.pageX - rect.left;
      const y = e.pageY - rect.top;
      app.mouseX = x;
      app.mouseY = y;
    },
    [MOUSE.LEFT]: e => {
      const { app } = this.context;
      app.player.seek(app.mouseTime)
    },
    [MOUSE.MIDDLE]: e => {
      const { app } = this.context;
      app.moveViewLeft(-e.movementX, true);
    }
  })

}





@observer
export class Ruler extends React.Component {
  static contextType = AppContext;

  render() {
    const { app } = this.context;
    return (
      <div className="tc ruler">
        <div className="units" style={{left:-app.viewLeft}}>
          <RulerUnits />
        </div>
      </div>
    )
  }
}


@observer
export class RulerUnits extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed get seconds() {
    const { app } = this.context;
    return Math.max(app.player.totalTime, app.viewDuration);
  }

  static contextType = AppContext;
  render() {
    const { app } = this.context;
    const seconds = [];
    let step = Math.ceil(64 / app.zoomX)
    for (let i = 0; i <= this.seconds; i += step) {
      seconds.push(<div key={i} className="second" style={{ width: app.zoomX * step }}>{i}</div>)
    }
    return seconds;
  }
}


@observer
export class SeekCursor extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }
  @computed get X2() {
    const { app } = this.props;
    const { player } = app;
    if (!player) return 0;
    return (player.playbackTime / player.totalTime * 100).toFixed(4) + '%';
  }

  @computed get visible() {
    const { app } = this.props;
    const { X } = this;
    return X >= app.viewLeft && X <= app.viewLeft + app.viewWidth;
  }

  @computed get X() {
    const { app } = this.props;
    const { player } = app;
    if (!player) return 0;
    return Math.round(player.playbackTime * app.zoomX);

  }
  render() {
    if (!this.visible) return null;
    const { app } = this.props;
    //refs={ref => false && app.player.playing && ref?.scrollIntoView({ block: 'nearest', inline: app.player?.holding ? 'nearest' : 'center' })} 
    return <div className="tc seek-cursor" style={{ left: this.X }} />
  }
}

@observer
export class MouseCursor extends React.Component {
  render() {
    const { app } = this.props;
    if (app.mouseTime === null) return null;
    return (
      <>
        <div className="tc mouse-cursor" style={{ left: app.mouseTime * app.zoomX }} />
      </>
    )
  }
}

@observer
export class LoopRegion extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed get X() {
    const { app } = this.props;
    return (app.loopIn / app.player.totalTime * 100).toFixed(4) + '%';
  }
  @computed get W() {
    const { app } = this.props;
    return ((app.loopOut - app.loopIn) / app.player.totalTime * 100).toFixed(4) + '%';
  }
  render() {
    const { app } = this.props;
    if (!app.hasLoop) return null;
    return (
      <div className="tc loop-region" style={{ left: this.X, width: this.W }}>
        <Draggable className="in splitter" onDrag={e => app.moveLoopIn(e.movementX / app.zoomX)} />
        <Draggable className="out splitter" onDrag={e => app.moveLoopOut(e.movementX / app.zoomX)} />
      </div>
    )
  }
}
