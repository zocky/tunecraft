import React from "react";
import { observer } from "mobx-react";
import { action, computed, observable, makeObservable, toJS, trace } from "mobx";
import "./Tracks.less";
import { AppContext, Draggable, onResize, onWheel, Wheelable } from "./Utils";
import { classes } from "../lib/utils";
import { TrackView } from "./TrackView";

const COLORS = [
  "#FF695E",
  "#FF851B",
  "#FFE21F",
  "#D9E778",
  "#2ECC40",
  "#6DFFFF",
  "#54C8FF",
  "#A291FB",
  "#DC73FF",
  "#FF8EDF",
  "#D67C1C",
  "#DCDDDE",
  "#545454",
  "#DB2828",
  "#F2711C",
  "#FBBD08",
  "#B5CC18",
  "#21BA45",
  "#00B5AD",
  "#2185D0",
  "#6435C9",
  "#A333C8",
  "#E03997",
  "#A5673F",
  "#767676",
];


@observer
export class Tracks extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    return (
      <div className="tracks" style={{ top: -app.viewTop }}>
        <TrackList />
      </div>
    )
  }
}

@observer
export class TrackList extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    console.log("render", this.constructor.name);
    //const tracks = app.tracks.filter(({ events }) => events.length);
    return (
      <div
        className="tracks"
      >
        {app.trackKeys.map((idx) => (
          <TrackView
            key={idx}
            app={app}
            idx={idx}
            color={COLORS[idx % COLORS.length]}
          />
        ))}
      </div>
    );
  }
}




@observer
export class TrackHeaders extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    console.log("render", this.constructor.name);
    //const tracks = app.tracks.filter(({ events }) => events.length);
    return (
      <div className="tc track-headers" ref={ref => ref && onWheel(ref, e => {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          if (e.deltaY > 0) {
            app.zoomOutY()
          } else {
            app.zoomInY()
          }
        }
        if (!e.ctrlKey && !e.shiftKey) {
          app.moveViewTop(e.deltaY);
        }
      })}>
        <TrackHeadersPositioned />
      </div>
    );
  }
}

@observer
export class TrackHeadersPositioned extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;
    return (
      <div className="headers" style={{ top: -app.viewTop }}>
        <TrackHeaderList />
      </div>
    )
  }
}


@observer
export class TrackHeaderList extends React.Component {
  static contextType = AppContext;
  render() {
    const { app } = this.context;

    return (
      app.trackKeys.map((idx) => (
        <TrackHeader
          key={idx}
          app={app}
          idx={idx}
          color={COLORS[idx % COLORS.length]}
        />
      ))
    );
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
          "--track-color": this.props.color,
        }}
      >
        <span className="track-id">{this.track.id}</span>
        <span className="buttons">
          <button
            className={classes("tc track-button mute", {
              active: app.isTrackMuted(id),
            })}
            onMouseDown={() => app.toggleMuteTrack(id)}
          >
            M
          </button>
          <button
            className={classes("tc track-button solo", {
              active: app.isTrackSolo(id),
            })}
            onMouseDown={() => app.toggleSoloTrack(id)}
          >
            S
          </button>
        </span>
      </div>
    );
  }
}
