
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

  render() {
    const { app } = this.props;
    const tracks = app.tracks.filter(({ events }) => events.length);
    console.log(tracks)
    return (
      <div className="tc tracks">
        <Scroller app={app}/>
        {tracks.map((track, idx) =>
          <Track key={track.id} app={app} track={track} id={track.id} idx={idx} color={COLORS[idx % COLORS.length]} />
        )}
        <SeekCursor app={app} tracks={app.parsed?.tracks} />
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

    const zoomX = 32;

    let min = 60;
    let max = 60;

    for (let track of tracks) {
      for (let event of track.events) {
        min = Math.min(event.note, min);
        max = Math.max(event.note, max);
      }
    }

    canvas.height = (max - min);
    canvas.width = zoomX * app.parsed.length;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.strokeRect(0, (max - 60), canvas.width, 0);

    for (let idx in tracks) {
      let track = tracks[idx];
      let color = COLORS[idx % COLORS.length];
      drawNotes(ctx, track, { color, min, max, zoomX, zoomY:1 });
    }

    return canvas.toDataURL("image/png");
  }


  render() {
    return (
      <img src={this.scrollImage} />
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
    const xZoom = 64;
    return player.playbackTime * xZoom;

  }
  render() {
    return <div ref={ref => ref?.scrollIntoView({ inline: 'center' })} className="tc seek-cursor" style={{ left: this.X }} />
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
    const canvas = document.createElement('canvas');
    const { app, track, color } = this.props;

    const zoomX = 64;
    const zoomY = 3;

    const min = Math.min(48, ...track.events.map(e => e.note));
    const max = Math.max(72, ...track.events.map(e => e.note));

    console.log(min, max, app.parsed.length);
    canvas.height = zoomY * (max - min);
    canvas.width = zoomX * app.parsed.length;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.strokeRect(0, (max - 60) * zoomY, canvas.width, 0);

    drawNotes(ctx, track, { color, min, max, zoomX, zoomY });
    return canvas.toDataURL("image/png");
  }

  render() {
    const { app, track, id } = this.props;
    return (
      <div className="tc track">
        <div className="header">
          {id} {track.length} notes
        </div>
        <img src={this.trackImage} />
      </div>
    )
  }
}


function drawNotes(ctx, track, { color, max, zoomX, zoomY }) {
  ctx.fillStyle = color;
  for (const e of track.events) {
    const x = Math.floor(e.at * zoomX);
    const y = Math.floor((max - e.note) * zoomY);
    const w = Math.max(1, Math.floor(e.duration * zoomX - 2));
    const h = zoomY;
    ctx.fillRect(x, y, w, h);
  }
}