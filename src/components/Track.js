import React from "react";
import { observer } from "mobx-react";
import { action, computed, observable, makeObservable, toJS, trace } from "mobx";
import { Draggable, onResize, onWheel, Wheelable } from "./Utils";




@observer
export class Track extends React.Component {
  constructor(...args) {
    super(...args);
    this.app = this.props.app;
    makeObservable(this);
  }

  @action
  componentDidMount() {
    console.log('mounted')
    this.props.app.trackComponents[this.props.idx] = this;
    onResize(this.ref, (e) => {
      //this.props.app.trackHeights[this.props.idx] = e.height;
      this.height = e.height;

    });
  }

  @observable height = 0;

  @computed get selectedNotes() {
    return this.props.app.selectedNotes.filter(e=>e.track === this.track.id)
  }

  @computed get canvasWidth() {
    return this.app.viewTotalWidth;
  }

  @computed get canvasHeight() {
    return this.app.zoomY * (this.max - this.min);
  }


  @computed get events() {
    return JSON.parse(this.eventsJSON);
  }

  @computed get notes() {
    return this.events.filter(e => e.event === "N")
  }

  @computed get bars() {
    return this.events.filter(e => e.event === "B")
  }

  @computed get color() {
    return this.props.color;
  }

  @computed get eventsJSON() {
    return JSON.stringify(toJS(this.track?.events));
  }

  @computed get track() {
    return this.app.tracks[this.props.idx];
  }

  render() {
    const { app } = this;
    //console.log('render track',this.props.idx)
    return (
      <div className="tc track" ref={(ref) => (this.ref = ref)}>
        <TrackBackground app={app} trackView={this} />
        <TrackNotes app={app} trackView={this} />
        <TrackSelectedNotes app={app} trackView={this} />
      </div>
    );
  }

  @computed get min() {
    const {zoomY} = this.app;
    if (zoomY>=4) {
      return Math.min(Infinity, ...this.notes.map((e) => e.note - 2));
    }
    return Math.min(48, ...this.notes.map((e) => e.note - 2));
  }

  @computed get max() {
    const {zoomY} = this.app;
    if (zoomY>=4) {
      return Math.max(-Infinity, ...this.notes.map((e) => e.note +2 ));
    }
    return Math.max(72, ...this.notes.map((e) => e.note + 2));
  }
}


@observer
export class TrackNotes extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed
  get trackImage() {
    const canvas = document.createElement("canvas");
    const { app, trackView } = this.props;

    const { zoomX, zoomY } = app;
    const { events, notes, min, max, canvasWidth, canvasHeight, color } = trackView;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    const ctx = canvas.getContext("2d");

    drawNotes(ctx, notes, { color, min, max, zoomX, zoomY });
    drawBars(ctx, events, { color, min, max, zoomX, zoomY });
    return canvas.toDataURL("image/png");
  }

  render() {
    const { app } = this.props;
    //console.log('render track',this.props.idx)
    return (
      <img className="notes" draggable={false} src={this.trackImage} />
    );
  }
}

@observer
export class TrackSelectedNotes extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed
  get trackImage() {
    const canvas = document.createElement("canvas");
    const { app, trackView } = this.props;

    const { zoomX, zoomY } = app;
    const { selectedNotes, min, max, canvasWidth, canvasHeight, color } = trackView;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    const ctx = canvas.getContext("2d");

    drawNotes(ctx, selectedNotes, { color:'#FFF', min, max, zoomX, zoomY });
    return canvas.toDataURL("image/png");
  }

  render() {
    const { app } = this.props;
    //console.log('render track',this.props.idx)
    return (
      <img className="notes" draggable={false} src={this.trackImage} />
    );
  }
}



@observer
export class TrackBackground extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed
  get trackImage() {
    const canvas = document.createElement("canvas");
    const { app, trackView } = this.props;

    const { zoomX, zoomY } = app;
    const { events, notes, min, max, canvasWidth, canvasHeight, color } = trackView;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    const ctx = canvas.getContext("2d");

    if (zoomY >= 4) {
      drawKeys(ctx, { color, min, max, zoomY })
    } else {
      drawLines(ctx, { min, max, zoomY });
    }
    return canvas.toDataURL("image/png");
  }

  render() {
    const { app } = this.props;
    //console.log('render track',this.props.idx)
    return (
      <img className="background" draggable={false} src={this.trackImage} />
    );
  }
}




function drawNotes(
  ctx,
  events,
  { color, max, min, zoomX, zoomY, fixedY, gap = 2 }
) {
  let n = 0;
  //const now = performance.now();
  ctx.beginPath();
  //let _events = events.filter(e=>e.event==='N')
  for (const e of events) {
    if (e.event === "N") {
      ctx.fillStyle = color;
      let x = Math.floor(e.at * zoomX);
      let y = (fixedY ?? max - e.note) * zoomY;
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
}

function drawBars(
  ctx,
  events,
  { max, min, zoomX, zoomY }
) {
  ctx.beginPath();
  for (const e of events) {
    if (e.event === "B") {
      let x = Math.round(e.at * zoomX) - 2 + 0.5;
      let y = 0;
      let w = 1;
      let h = zoomY * (max - min);
      ctx.rect(x, y, w, h);
    }
  }
  ctx.fillStyle = "#444";
  ctx.fill();
}

function drawLines(ctx, { color, min, max, zoomY }) {
  for (let i = min + 12 - (min % 12); i <= max - (min % 12); i += 12) {
    if (i == 60) ctx.fillStyle = "#fff8";
    else ctx.fillStyle = "#fff2";
    ctx.fillRect(0, (max - i - 0.5) * zoomY, ctx.canvas.width, 1);
  }
}

function drawKeys(ctx, { min, max, zoomY }) {
  for (let i = min; i <= max; i++) {

    switch (i % 12) {
      case 1:
      case 3:
      case 6:
      case 8:
      case 10:
        ctx.fillStyle = "#fff2";
        break;
      default:
        ctx.fillStyle = "#fff6";
    }
    ctx.fillRect(0, (max - i) * zoomY + 0.5, ctx.canvas.width, zoomY - 1);
  }
}