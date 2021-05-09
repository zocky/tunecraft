
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
//import "./Tracks.less";
import { Draggable, onResize, onWheel, Wheelable } from "./Utils";

@observer
export class Overlay extends React.Component {

  render() {
    const { app } = this.props;
    console.log('render', this.constructor.name)
    return (
      <div className="overlay"
        ref={ref => this.ref = ref}
        onMouseDown={e => {
          if (e.buttons === 1) {
            app.player.hold();
            app.player.seek(app.mouseTime);
          }
        }}
        onMouseUp={e => {
          app.player.unhold();
        }}
        onMouseMove={action(e => {
          const { app } = this.props;
          const x = e.pageX - this.ref.getBoundingClientRect().left;
          app.mouseX = x;

          if (e.buttons === 1) {
            app.player.seek(app.mouseTime)
          } else if (e.buttons === 4) {
            app.moveViewLeft(-e.movementX);
          }
        })}
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
}


@observer
export class Ruler extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed get seconds() {
    const {app} = this.props;
    return Math.max(app.player.totalTime,app.viewDuration);
  }
  render() {
    const { app } = this.props;
    //if (!app.tune) return null;
    const seconds = [];
    let step = Math.ceil(64 / app.zoomX)
    for (let i = 0; i <= this.seconds; i += step) {
      seconds.push(<div key={i} className="second" style={{ width: app.zoomX * step }}>{i}</div>)
    }
    return (
      <div className="tc ruler">
        <div className="units" style={{
          left: -app.viewLeft
        }}>
          {seconds}
        </div>
      </div>
    )
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
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }
  @computed get X() {
    const { app } = this.props;
    return Math.round(app.mouseTime * app.zoomX);
  }
  render() {
    //return null;
    if (this.props.app.mouseTime === null) return null;
    return <div ref={ref => ref?.scrollIntoView({ block: 'nearest', inline: 'nearest' })} className="tc mouse-cursor" style={{ left: this.X }} />
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
