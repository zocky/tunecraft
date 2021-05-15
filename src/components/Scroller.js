
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
import { Draggable, Wheelable, AppContext } from "./Utils";


@observer
export class Scroller extends React.Component {
  static contextType = AppContext

  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @action
  componentDidMount() {
    const { app } = this.context;
    var ro = new ResizeObserver(action(entries => {
      for (let entry of entries) {
        const cr = entry.contentRect;
        app.scroller.width = cr.width;
      }
    }));

    ro.observe(this.ref);
  }

  @computed 
  get scrollerSvg() {
    const { app } = this.context
    let svgString=`<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 ${app.viewTotalTime} ${Math.max(8,app.trackViews.length)}">
    ${app.trackViews.map((t,i)=>`
      <g fill="${t.color}">
        ${t.notes.map((e)=>`<rect x="${e.at}" y="${i}" width="${e.duration}" height="1" vector-effect="non-scaling-stroke" />`)}
      </g>
    `)}
    </svg>`
    var decoded = unescape(encodeURIComponent(svgString));
    var base64 = btoa(decoded);
    return `data:image/svg+xml;base64,${base64}`;
  }

  @action.bound
  onMouseDown(e) {
    const { app } = this.context;
    const x = e.pageX - this.ref.getBoundingClientRect().left;
    app.scroller.centerView(x);
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    const { app } = this.context;

    return (
      <div 
        className="tc scroller" 
        ref={ref => this.ref = ref}
        onMouseDown={this.onMouseDown}
      >
        <img style={{ imageRendering: "pixelated" }} className="track" src={this.scrollerSvg} />
        <ScrollerSeekCursor app={app} />
        <ScrollerViewRegion app={app} />
      </div>
    )
  }
}

@observer
export class ScrollerSeekCursor extends React.Component {
  @computed get X() {
    const { app } = this.props;

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