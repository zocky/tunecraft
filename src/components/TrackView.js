import React from "react";
import { observer } from "mobx-react";
import { action, computed, observable, makeObservable, toJS, trace, runInAction } from "mobx";
import { AppContext, Draggable, onResize, onWheel, Wheelable } from "./Utils";

import { indexToColor } from "../lib/utils"



export class TrackViewState {
  constructor(app, index) {
    this.app = app;
    this.index = index;
    makeObservable(this);
  }

  @computed get width() {
    return this.app.viewTotalWidth;
  }

  @computed get height() {
    return this.app.zoomY * this.span;
  }

  @computed get span() {
    return (this.max - this.min + 1);
  }

  @computed get eventsJSON() {
    return JSON.stringify(toJS(this.tuneTrack?.events || []));
  }

  @computed get tuneTrack() {
    return this.app.tracks[this.index];
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
    return indexToColor(this.index);
  }


  @computed get highlightedNotes() {
    return this.app.highlightedNotes?.filter(e => e.track === this.tuneTrack.id) || []
  }

  @computed get selectedNotes() {
    return [this.app.selectedNote, this.app.mouseNote].filter(e => e && e.track === this.tuneTrack.id)
  }

  @computed get min() {
    if (!this.notes.length) return 60;
    return Math.min(...this.notes.map((e) => e.note - 2));
  }

  @computed get max() {
    if (!this.notes.length) return 71;
    return Math.max(this.min + 12, ...this.notes.map((e) => e.note + 2));
  }
}

@observer
export class TrackView extends React.Component {
  static contextType = AppContext;
  constructor(props, ...rest) {
    super(props, ...rest);
    const {app} = this.context;
    const {idx} = props;
    runInAction(()=>this.trackView = app.trackViews[idx] = new TrackViewState(app, idx));
    makeObservable(this);
  }

  @observable trackView = this;


  render() {
    const { app, trackView } = this;
    const { height, width } = trackView
    //console.log('render track',this.props.idx)
    return (
      <div className="tc track" ref={(ref) => (this.ref = ref)} style={{
        width, height
      }}>
        <TrackBackground trackView={trackView} />
        <TrackNotes trackView={trackView} />
        <TrackHighlightedNotes trackView={trackView} />
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
  get trackSvg() {
    const { trackView } = this.props;
    const { app, notes, span, color, max } = trackView;
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 ${app.viewTotalTime} ${span}">
      <g fill="${color}" stroke="#0005" stroke-width="2px">
        ${notes.map((e, i) => `
          <rect x="${e.at}" y="${max - e.note}" stroke="none" width="${e.duration}" height="1" vector-effect="non-scaling-stroke" />
          <rect x="${e.at}" y="${max - e.note}" stroke="none" fill="#0006" width="${e.duration}" height="${1 - e.velocity / 100}" vector-effect="non-scaling-stroke" />
          <line x1="${e.at}" x2="${e.at}" y1="${max - e.note}" y2="${max - e.note + 1}" width="${e.duration}" height="${1 - e.velocity / 100}" vector-effect="non-scaling-stroke" />
        `)}
      </g>
    </svg>`
    var decoded = unescape(encodeURIComponent(svgString));
    var base64 = btoa(decoded);
    return `data:image/svg+xml;base64,${base64}`;
  }

  render() {
    return (
      <img className="notes" draggable={false} src={this.trackSvg} />
    );
  }
}

@observer
export class TrackHighlightedNotes extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed
  get trackSvg() {
    const { trackView } = this.props;
    const { app, highlightedNotes, selectedNotes, span, max } = trackView;
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 ${app.viewTotalTime} ${span}">
      <g fill="none" stroke="white" stroke-width="2px">
        ${highlightedNotes.map((e, i) => `<rect x="${e.at}" y="${max - e.note}" width="${e.duration}" height="1" vector-effect="non-scaling-stroke" />`)}
      </g>
      <g fill="white" stroke="white" stroke-width="1px">
        ${selectedNotes.map((e, i) => `<rect x="${e.at}" y="${max - e.note}" width="${e.duration}" height="1" vector-effect="non-scaling-stroke" />`)}
      </g>
    </svg>`
    var decoded = unescape(encodeURIComponent(svgString));
    var base64 = btoa(decoded);
    return `data:image/svg+xml;base64,${base64}`;
  }


  render() {
    return (
      <img className="notes" draggable={false} src={this.trackSvg} />
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
    const { trackView } = this.props;

    const { height, app:{ zoomY }} = trackView;
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

  @computed
  get trackSvg() {
    const { trackView } = this.props;
    const {  span, max, app} = trackView;
    const { beats } = app.tune;
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 ${app.viewTotalTime} ${span}">
      <g stroke-width="1px">
        ${beats.map((e) => `<line 
          stroke-width="${e.beat ? "1px" : "2px"}" stroke="${e.beat ? "#444" : "#444"}"
          x1="${e.at}" x2="${e.at}" y1="0" y2="${span}"
          vector-effect="non-scaling-stroke" />`)}
      </g>
    </svg>`
    var decoded = unescape(encodeURIComponent(svgString));
    var base64 = btoa(decoded);
    return `data:image/svg+xml;base64,${base64}`;
  }

  render() {
    return (
      <>
        <img className="background" draggable={false} src={this.trackImage} />
        <img className="background" draggable={false} src={this.trackSvg} />
      </>
    );
  }
}

function drawLines(ctx, { color, min, max, app: { zoomY } }) {
  for (let i = min + 12 - (min % 12); i <= max - (min % 12); i += 12) {
    if (i == 60) ctx.fillStyle = "#fff8";
    else ctx.fillStyle = "#fff2";
    ctx.fillRect(0, (max - i - 0.5) * zoomY, ctx.canvas.width, 1);
  }
}

function drawKeys(ctx, { color, index, min, max, app: { zoomY } }) {
  const
    w1 = color,
    w2 = w1,
    b1 = '#111',
    b2 = b1;
  const colors = [w1, b1, w1, b1, w1, w2, b2, w2, b2, w2, b2, w2]
  const line = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]
  const black = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]
  ctx.save();

  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.globalAlpha = 0.1;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ctx.canvas.width, 1);

  ctx.globalAlpha = 1;
  for (let i = min; i <= max; i++) {
    if (black[i % 12]) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, (max - i) * zoomY, ctx.canvas.width, zoomY);
    }
    if (line[i % 12]) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, (max - i) * zoomY - 0.5, ctx.canvas.width, 1);
    }
  }
  ctx.restore();
}