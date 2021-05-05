
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
import "./Tracks.less";
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
  }
  render() {
    const { app } = this.props;
    //const tracks = app.tracks.filter(({ events }) => events.length);
    return (
      <>
        <Scroller app={app} />
        <div className="tc tracks">
          <div className="tracks" ref={el=>el?.addEventListener('wheel',this.onWheel,{passive:false})}>
            {app.trackKeys.map((idx) =>
              <Track key={idx} app={app} idx={idx} color={COLORS[idx % COLORS.length]} />
            )}
          </div>
          <LoopRegion app={app}/>
          <SeekCursor app={app}/>
        </div>
      </>
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
    if(!this.props.app.tune?.length) return null;
    return (
      <img style={{ imageRendering: "pixelated" }} className="tc scroller" src={this.scrollImage} />
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
    return player.playbackTime * app.zoomX;

  }
  render() {
    const { app } = this.props;
    return <div ref={ref => app.player.playing && ref?.scrollIntoView({ block: 'nearest', inline: app.player?.holding ? 'nearest' : 'center' })} className="tc seek-cursor" style={{ left: this.X }} />
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
    return app.loopIn * app.zoomX;
  }
  @computed get W() {
    const { app } = this.props;
    return (app.loopOut-app.loopIn) * app.zoomX;
  }
  render() {
    const { app } = this.props;
    return <div className="tc loop-region" style={{ left: this.X, width:this.W }} />
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

    const notes = this.events.filter(e => 'note' in e);

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
      for (let i = min + 12 - min % 12; i <= max - min % 12; i+=12) {
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
          onMouseDown={e => {
            if (e.buttons === 1) {
              app.player.hold();
              app.player.seek(e.nativeEvent.offsetX / app.zoomX);
            }
          }}
          onMouseUp={e => {
            app.player.unhold();
          }}
          onMouseMove={e => {
            if (e.buttons === 1) {
              app.player.seek(e.nativeEvent.offsetX / app.zoomX)
            }
          }} />
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