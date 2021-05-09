
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
import { Draggable, Wheelable } from "./Utils";
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
export class Scroller extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @action
  componentDidMount() {
    const { app } = this.props;
    var ro = new ResizeObserver(action(entries => {
      for (let entry of entries) {
        const cr = entry.contentRect;
        app.scroller.width = cr.width;
      }
    }));

    ro.observe(this.ref);
  }

  @computed
  get scrollerImage() {
    const canvas = document.createElement('canvas');

    const { app } = this.props;
    if (app.tune?.length) {
    const { tracks } = app;

    const zoomX = app.scroller.zoom;

    canvas.height = tracks.length * 4;

    canvas.width = zoomX * app.tune.length;
    const ctx = canvas.getContext('2d');
    //ctx.fillStyle = "#111";
    //ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let idx in tracks) {
      let track = tracks[idx];
      let color = COLORS[idx % COLORS.length];
      drawNotes(ctx, track.events, { color, min: 0, max: tracks.length, zoomX, zoomY: 2, fixedY: idx * 2, gap: 0 });
    }
  }
    return canvas.toDataURL("image/png");
  }

  @action.bound
  onMouseDown(e) {
    const {app}=this.props;
    const x = e.pageX - this.ref.getBoundingClientRect().left;
    app.scroller.centerView(x);
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    return (
      <div 
        className="tc scroller" 
        ref={ref => this.ref = ref}
        onMouseDown={this.onMouseDown}
      >
        <img style={{ imageRendering: "pixelated" }} className="track" src={this.scrollerImage} />
        <ScrollerSeekCursor app={app} />
        <ScrollerViewRegion app={app} />
      </div>
    )
  }
}

@observer
export class ScrollerSeekCursor extends React.Component {
  @computed get X() {
    const { player } = app;
    if (!player) return 0;
    return Math.round(player.playbackTime * app.scroller.zoom);

  }
  render() {
    return <div className="tc seek-cursor" style={{ left: this.X }} />
  }
}



@observer
export class ScrollerViewRegion extends React.Component {
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed get X() {
    const { app } = this.props;
    return app.scroller.viewLeft;
  }
  @computed get W() {
    const { app } = this.props;
    return app.scroller.viewWidth;
  }
  render() {
    const { app } = this.props;
    return (
      <Draggable 
        className="tc view-region" 
        style={{ left: this.X, width: this.W }} 
        onDrag={e=>app.scroller.moveView(e.movementX)}
        onMouseDown={e=>e.stopPropagation()}
      />
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