
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
import "./Tracks.less";
import { Draggable } from "./Utils";
const COLORS = [
  '#FF695E',
  '#FF851B',
  '#FFE21F',
  '#D9E778',
  '#2ECC40',
  '#6DFFFF',
  '#54C8FF',
  '#A291FB',
  '#DC73FF',
  '#FF8EDF',
  '#D67C1C',
  '#DCDDDE',
  '#545454',
  '#DB2828',
  '#F2711C',
  '#FBBD08',
  '#B5CC18',
  '#21BA45',
  '#00B5AD',
  '#2185D0',
  '#6435C9',
  '#A333C8',
  '#E03997',
  '#A5673F',
  '#767676',
];

@observer
export class Tracks extends React.Component {
  onWheel = e => {
    const { app } = this.props;
    if (e.shiftKey) {
      if (e.deltaY > 0) {
        app.zoomOutY()
      } else {
        app.zoomInY()
      }
      e.preventDefault();
    }
    if (e.ctrlKey) {
      if (e.deltaY > 0) {
        app.zoomOutX()
      } else {
        app.zoomInX()
      }
      e.preventDefault();
    }
  }
  render() {
    const { app } = this.props;
    console.log('render',this.constructor.name)
    //const tracks = app.tracks.filter(({ events }) => events.length);
    return (
      <>
        <Scroller app={app} />
        <div className="tc tracks" ref={el => el?.addEventListener('wheel', this.onWheel, { passive: false })}>
          <div className="view"   >
            <Ruler app={app} />
            <div className="tracks" >
              {app.trackKeys.map((idx) =>
                <Track key={idx} app={app} idx={idx} color={COLORS[idx % COLORS.length]} />
              )}
            </div>
            <div className="overlay"
              onMouseDown={e => {
                if (e.buttons === 1) {
                  app.player.hold();
                  app.player.seek(e.nativeEvent.offsetX / app.zoomX);
                }
              }}
              onMouseUp={e => {
                app.player.unhold();
              }}
              onMouseMove={action(e => {
                const time = e.nativeEvent.offsetX / app.zoomX;
                let mt = 0;
                const {events} = this.props.app.tune;
                let lower = 0;
                let upper =events.length;
                let counter = 100;
                while (lower!==upper) {
                  if (counter-- < 1) break;
                  let mid = Math.floor((lower+upper)/2);
                  mt= events[mid].at;
                  if (mt > time) {
                    upper=mid;
                    continue;
                  } else if (mt<time) {
                    lower= mid;
                    continue;
                  }
                  break;
                }
                app.mouseTime = mt;

                if (e.buttons === 1) {
                  app.player.seek(app.mouseTime)
                }
              })}
              onMouseEnter={action(e => {
                
              })}
              onMouseLeave={action(e => {
                app.mouseTime = null;
              })}
            >
              <LoopRegion app={app} />
              <MouseCursor app={app} />
              <SeekCursor app={app} />
            </div>
          </div>
        </div>
      </>
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
    return this.props.app.tune?.length | 0;
  }
  render() {
    const { app } = this.props;
    //if (!app.tune) return null;
    const seconds = [];
    for (let i = 0; i <= this.seconds; i++) {
      seconds.push(<div key={i} className="second" style={{ width: app.zoomX }}>{i}</div>)
    }
    return (
      <div className="tc ruler">
        {seconds}
      </div>
    )
  }
}

@observer
export class Scroller extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed
  get scrollImage() {
    const canvas = document.createElement('canvas');
    const { app } = this.props;
    const { tracks } = app;


    canvas.height = tracks.length * 4;
    canvas.width = 32 * app.tune.length;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let idx in tracks) {
      let track = tracks[idx];
      let color = COLORS[idx % COLORS.length];
      drawNotes(ctx, track.events, { color, min: 0, max: tracks.length, zoomX: 32, zoomY: 2, fixedY: idx * 2, gap: 0 });
    }

    return canvas.toDataURL("image/png");
  }


  render() {
    if (!this.props.app.tune?.length) return null;
    return (
      <div className="tc scroller">
        <img style={{ imageRendering: "pixelated" }} className="track" src={this.scrollImage} />
        <LoopRegion app={app} />
        <SeekCursor app={app} />
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
  @computed get X() {
    const { app } = this.props;
    const { player } = app;
    if (!player) return 0;
    return (player.playbackTime / player.totalTime * 100).toFixed(4) + '%';
  }

  @computed get X2() {
    const { app } = this.props;
    const { player } = app;
    if (!player) return 0;
    return player.playbackTime * app.zoomX;

  }
  render() {
    const { app } = this.props;
    return <div ref={ref => app.player.playing && ref?.scrollIntoView({ block: 'nearest', inline: app.player?.holding ? 'nearest' : 'center' })} className="tc seek-cursor" style={{ left: this.X }} />
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
    return Math.round(app.mouseTime*app.zoomX);
  }
  render() {
    return null;
    if(isNaN(this.props.app.mouseTime)) return null;
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
    return ((app.loopOut-app.loopIn) / app.player.totalTime * 100).toFixed(4) + '%';
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

@observer
export class Track extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }


  @computed
  get trackImage() {
    //console.log('drawing', this.track.id)
    const canvas = document.createElement('canvas');
    const { app, color } = this.props;

    const zoomX = app.zoomX;
    const zoomY = app.zoomY;

    const notes = this.events.filter(e => e.event === 'ON');
    const min = Math.min(48, ...notes.map(e => e.note - 4));
    const max = Math.max(72, ...notes.map(e => e.note + 2));

    canvas.height = zoomY * (max - min);
    canvas.width = zoomX * app.tune.length;

    const ctx = canvas.getContext('2d');

    if (zoomY >= 4) {
      for (let i = min; i <= max; i++) {
        switch (i % 12) {
          case 1:
          case 3:
          case 6:
          case 8:
          case 10:
            ctx.fillStyle = "#0004";
            break;
          default:
            ctx.fillStyle = "#fff4";
        }
        ctx.fillRect(0, (max - i) * zoomY + 0.5, canvas.width, zoomY - 1);
      }
    } else {
      for (let i = min + 12 - min % 12; i <= max - min % 12; i += 12) {
        if (i == 60) ctx.fillStyle = "#fff6";
        else ctx.fillStyle = "#fff2";
        ctx.fillRect(0, (max - i - 0.5) * zoomY, canvas.width, 1);
      }
    }

    drawNotes(ctx, this.events, { color, min, max, zoomX, zoomY });
    return canvas.toDataURL("image/png");
  }

  @computed.struct get events() {
    return this.track?.events;
  }

  @computed get track() {
    return this.props.app.tracks[this.props.idx];
  }

  render() {
    const { app } = this.props;
    return (
      <div className="tc track">
        <div className="header">
          {this.track.id}
        </div>
        <img draggable="false" src={this.trackImage}
        />
      </div>
    )
  }
}


function drawNotes(ctx, events, { color, max, min, zoomX, zoomY, fixedY, gap = 2 }) {
  for (const e of events) {
    if (e.event === 'N') {
      ctx.fillStyle = color;
      let x = Math.floor(e.at * zoomX);
      let y = (fixedY ?? (max - e.note)) * zoomY;
      let w = Math.max(1, Math.floor(e.duration * zoomX - gap));
      let h = zoomY;
      ctx.fillRect(x, y, w, h);
    } else if (e.event === 'B') {
      ctx.fillStyle = "#000";
      let x = Math.round(e.at * zoomX) - 2;
      let y = 0;
      let w = 1;
      let h = zoomY * (max - min);
      ctx.fillRect(x, y, w, h);
    }
  }
}