import React from "react";
import { observer } from "mobx-react";
import { action, computed, observable, makeObservable, toJS, trace } from "mobx";
import { Draggable, onResize, onWheel, Wheelable } from "./Utils";




@observer
export class TrackView extends React.Component {
  constructor(...args) {
    super(...args);
    this.app = this.props.app;
    makeObservable(this);
  }

  @action
  componentDidMount() {
    console.log('mounted')
    this.props.app.trackComponents[this.props.idx] = this;
  }

  @computed get width() {
    return this.app.viewTotalWidth;
  }

  @computed get height() {
    return this.app.zoomY * this.span;
  }

  @computed get span() {
    return (this.max - this.min +1);
  }

  @computed get eventsJSON() {
    return JSON.stringify(toJS(this.tuneTrack?.events));
  }

  @computed get tuneTrack() {
    return this.app.tracks[this.props.idx];
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
  @computed get index() {
    return this.props.idx;
  }

  @computed get selectedNotes() {
    return this.props.app.selectedNotes.filter(e=>e.track === this.tuneTrack.id)
  }


  @computed get min() {
    if (!this.notes.length) return 60;
    return Math.min(...this.notes.map((e) => e.note - 2));
  }

  @computed get max() {
    if (!this.notes.length) return 71;
    return Math.max(...this.notes.map((e) => e.note +2 ));
  }

  render() {
    const { app } = this;
    //console.log('render track',this.props.idx)
    return (
      <div className="tc track" ref={(ref) => (this.ref = ref)} style={{
        width: this.width,
        height: this.height
      }}>
        <TrackBackground app={app} trackView={this} />
        <TrackNotes app={app} trackView={this} />
        <TrackSelectedNotes app={app} trackView={this} />
      </div>
    );
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
    console.log('drawing notes')
    const canvas = document.createElement("canvas");
    const { app, trackView } = this.props;

    const { zoomX} = app;
    const { bars, notes, min, max, width, color, span } = trackView;
    canvas.height = span;
    canvas.width = width;
    const ctx = canvas.getContext("2d");

    drawNotes(ctx, notes, { color, min, max, zoomX, zoomY:1 });
    drawBars(ctx, bars, { color, min, max, zoomX, zoomY:1 });
    return canvas.toDataURL("image/png");
  }

  @computed 
  get trackSvg() {
    const { trackView, app } = this.props;
    const {notes,span,color,max} = trackView;
    let svgString=`<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 ${app.viewTotalTime} ${span}">
      <g fill="${color}">
        ${notes.map((e,i)=>`<rect x="${e.at}" y="${max-e.note}" width="${e.duration}" height="1"/>`)}
      </g>
    </svg>`
    var decoded = unescape(encodeURIComponent(svgString));
    var base64 = btoa(decoded);
    return `data:image/svg+xml;base64,${base64}`;
  }


  render() {
    return (
      <img className="notes" draggable={false} src={this.trackSvg}/>
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
    const { selectedNotes, min, max, width, height, color } = trackView;
    canvas.height = height;
    canvas.width = width;
    const ctx = canvas.getContext("2d");

    drawNotes(ctx, selectedNotes, { color:'#FFF', min, max, zoomX, zoomY });
    return canvas.toDataURL("image/png");
  }

  @computed 
  get trackSvg() {
    const { trackView, app } = this.props;
    const {selectedNotes,span,max} = trackView;
    let svgString=`<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 ${app.viewTotalTime} ${span}">
      <g fill="white">
        ${selectedNotes.map((e,i)=>`<rect x="${e.at}" y="${max-e.note}" width="${e.duration}" height="1"/>`)}
      </g>
    </svg>`
    var decoded = unescape(encodeURIComponent(svgString));
    var base64 = btoa(decoded);
    return `data:image/svg+xml;base64,${base64}`;
  }


  render() {
    return (
      <img className="notes" draggable={false} src={this.trackSvg}/>
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

    const { zoomY } = app;
    const { min, max, height } = trackView;
    canvas.height = height;
    canvas.width = 1;
    const ctx = canvas.getContext("2d");

    if (zoomY >= 4) {
      drawKeys(ctx, trackView)
    } else {
      drawLines(ctx, trackView);
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

function drawLines(ctx, { color, min, max,  app:{zoomY}  }) {
  for (let i = min + 12 - (min % 12); i <= max - (min % 12); i += 12) {
    if (i == 60) ctx.fillStyle = "#fff8";
    else ctx.fillStyle = "#fff2";
    ctx.fillRect(0, (max - i - 0.5) * zoomY, ctx.canvas.width, 1);
  }
}

function drawKeys(ctx, { color, index, min, max, app:{zoomY} }) {
  const
    w1 = color,
    w2 = w1,
    b1 = '#111',
    b2 = b1;
  const colors = [w1,b1,w1,b1,w1,w2,b2,w2,b2,w2,b2,w2]
  const line  =   [ 0 , 0 , 0 , 0 , 1 , 0 , 0 , 0 , 0 , 0 , 0 , 1 ]
  const black = [ 0 , 1 , 0 , 1 , 0 , 0 , 1 , 0 , 1 , 0 , 1 , 0]
  ctx.save();

  ctx.fillStyle="#666";
  ctx.fillRect(0, 0, ctx.canvas.width,ctx.canvas.height);
  
  ctx.globalAlpha = 0.125;
  ctx.fillStyle=color;
  ctx.fillRect(0, 0, ctx.canvas.width,ctx.canvas.height);

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#333';
  for (let i = min; i <= max; i++) {
    if (black[ i % 2 ]) {
      ctx.fillRect(0, (max - i) * zoomY , ctx.canvas.width, zoomY);
    } 
  }
  ctx.restore();
}