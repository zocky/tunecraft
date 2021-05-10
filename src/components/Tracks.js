
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable, toJS, trace } from "mobx";
import "./Tracks.less";
import { Draggable, onResize, onWheel, Wheelable } from "./Utils";
import { Scroller } from "./Scroller";
import { Overlay, Ruler } from "./Overlay";
import { classes } from "../lib/utils";

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

  componentDidMount() {
    onResize(this.ref, this.onResize);
    onWheel(this.ref, this.onWheel);
  }
  onResize = e => {
    const { app } = this.props;
    app.viewWidth = e.width;
    app.scrollHeight = e.height;
  }
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
    if (!e.ctrlKey && !e.shiftKey) {
      app.moveViewLeft(e.deltaY);
      e.stopPropagation();
      e.preventDefault();
    }
  }
  render() {
    const { app } = this.props;
    console.log('render', this.constructor.name)
    //const tracks = app.tracks.filter(({ events }) => events.length);
    return (
      <>
        <Scroller app={app} />
        <div className="tc tracks" ref={ref => this.ref = ref} >
          <TrackHeaders app={app} />
          <View app={app} />
        </div>
      </>
    )
  }
}


@observer
export class TrackList extends React.Component {
  render() {
    const { app } = this.props;
    console.log('render', this.constructor.name)
    //const tracks = app.tracks.filter(({ events }) => events.length);
    return (
      <div className="tracks"
        ref={ref => onResize(ref, e => app.totalTrackHeight = e.height)}
      >
        {app.trackKeys.map((idx) =>
          <Track key={idx} app={app} idx={idx} color={COLORS[idx % COLORS.length]} />
        )}
      </div>
    )
  }
}

@observer
export class TrackHeaders extends React.Component {
  render() {
    const { app } = this.props;
    console.log('render', this.constructor.name)
    //const tracks = app.tracks.filter(({ events }) => events.length);
    return (
      <div className="tc track-headers" ref={ref => ref && onWheel(ref, e => {
        e.stopPropagation();
        app.moveViewTop(e.deltaY);
        e.preventDefault();
      })}>
        <TrackHeaderList app={app} />
      </div>
    )
  }
}

@observer
export class TrackHeaderList extends React.Component {
  render() {

    return (
      <div className="headers">
        {app.trackKeys.map((idx) => (
          <TrackHeader key={idx} app={app} idx={idx} color={COLORS[idx % COLORS.length]} />
        ))}
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

  componentDidMount() {
    onResize(this.ref, e => {
      this.props.app.trackHeights[this.props.idx] = e.height;
    })
  }

  @computed get canvasWidth() {
    const { app } = this.props;
    return app.zoomX * app.tune.length;
  }


  @computed
  get trackImage() {
    //console.time('drawing');
    const canvas = document.createElement('canvas');
    const { app, color } = this.props;

    const zoomX = app.zoomX;
    const zoomY = app.zoomY;

    const notes = this.events.filter(e => e.event === 'ON');
    const min = Math.min(48, ...notes.map(e => e.note - 4));
    const max = Math.max(72, ...notes.map(e => e.note + 2));

    canvas.height = zoomY * (max - min);
    canvas.width = this.canvasWidth;

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
    const ret = canvas.toDataURL("image/png");
    //console.timeEnd('drawing');
    return ret;
  }

  @computed get events() {
    return JSON.parse(this.eventsJSON);
  }

  @computed get eventsJSON() {
    return JSON.stringify(toJS(this.track?.events));
  }

  @computed get track() {
    return this.props.app.tracks[this.props.idx];
  }

  render() {
    const { app } = this.props;
    //console.log('render track',this.props.idx)
    return (
      <div className="tc track" ref={ref => this.ref = ref}>
        <img draggable={false} src={this.trackImage} />
      </div>
    )
  }
}

@observer
export class TrackHeader extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }
  @computed get track() {
    return this.props.app.tracks[this.props.idx];
  }
  @computed get height() {
    if (this.props.app.trackHeights.length <= this.props.idx) return 0;
    return this.props.app.trackHeights[this.props.idx];
  }
  render() {
    const { app } = this.props;
    const { id } = this.track;
    return (
      <div
        className="tc track-header"
        style={{
          height: this.height,
          "--track-color": this.props.color
        }}
      >
        <span className="track-id">
          {this.track.id}
        </span>
        <span className="buttons">
          <button className={classes("tc track-button mute", {
            active: app.isTrackMuted(id)
          })}
            onMouseDown={() => app.toggleMuteTrack(id)}
          >M</button>
          <button className={classes("tc track-button solo", {
            active: app.isTrackSolo(id)
          })}
            onMouseDown={() => app.toggleSoloTrack(id)}
          >S</button>
        </span>
      </div>
    )
  }
}



function drawNotes(ctx, events, { color, max, min, zoomX, zoomY, fixedY, gap = 2 }) {
  let n = 0;
  //const now = performance.now();
  ctx.beginPath();
  //let _events = events.filter(e=>e.event==='N')
  for (const e of events) {
    if (e.event === 'N') {
      ctx.fillStyle = color;
      let x = Math.floor(e.at * zoomX);
      let y = (fixedY ?? (max - e.note)) * zoomY;
      let w = Math.max(1, Math.floor(e.duration * zoomX - gap));
      let h = zoomY;
      ctx.rect(x, y, w, h);
      n++;
      if (n == 1000) {
        ctx.fillStyle = color;
        ctx.fill();
        ctx.beginPath();
        n = 0;
      }
    }
  }
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  for (const e of events) {
    if (e.event === 'B') {
      let x = Math.round(e.at * zoomX) - 2 + 0.5;
      let y = 0;
      let w = 1;
      let h = zoomY * (max - min);
      ctx.rect(x, y, w, h);
    }
  }
  ctx.fillStyle = "#444";
  ctx.fill();
  //const spent = performance.now()-now;
  //console.log('per note',spent/events.length*1000000|0);
}