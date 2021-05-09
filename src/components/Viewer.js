
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
import "./Viewer.less";
import { Draggable, onResize, onWheel, Wheelable } from "./Utils";
import { Scroller } from "./Scroller";
import { Overlay, Ruler } from "./Overlay";
import { TrackHeaders, TrackList } from "./Tracks";
import logo from "url:../tunecraft.svg";
import { PlayerControls, PlayerLinks, PlayerTime } from "./Player";

@observer
export class Viewer extends React.Component {
  render() {
    const { app } = this.props;
    console.log('render', this.constructor.name)
    //const tracks = app.tracks.filter(({ events }) => events.length);
    return (
      <div className="tc viewer">
        <div className="tc splitter" />
        <PlayerControls app={app} />
        <PlayerTime app={app} />
        <PlayerLinks app={app} />
        <Scroller app={app} />
        <Ruler app={app} />
        <ViewPort app={app} />
        <div className="tc logo">
          <a href="https://github.com/zocky/tunecraft/blob/main/tunecraft.md" target="_blank" className="link">
          <img src={logo} />
          </a>
        </div>
        <TrackHeaders app={app} />
      </div>
    )
  }
}

@observer
export class View extends React.Component {
  componentDidUpdate() {
    console.log('rendered view');
    document.body.classList.remove('zooming');
  }
  render() {
    const { app } = this.props;
    return (
      <div className="view" style={{ left: -app.viewLeft }}>
        <TrackList app={app} />
        <Overlay app={app} />
      </div>
    )
  }
}


@observer
export class ViewPort extends React.Component {
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
    return (
      <div className="tc viewport" ref={ref => this.ref = ref} >
        <View app={app} />
      </div>
    )
  }
}

