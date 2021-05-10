
import React from "react";
import { observer } from "mobx-react";
import { action } from "mobx";

import './Player.less';
import { classes } from "../lib/utils";
import { formatTime } from "./Utils";

@observer
export class PlayerControls extends React.Component {
  render() {
    const { app } = this.props;
    const { player } = app;
    if (!player) return null;
    return (
      <div className="tc controls">
        <button
          onMouseDown={player.toggle}
          className={classes('tc control-button play', {
            active: player.playing
          })}>
          ⏯
          </button>
        <button
          onMouseDown={player.stop}
          className="tc control-button stop"
        >
          ⏹
          </button>
        <button
          onMouseDown={action(() => player.looping = !player.looping)}
          className={classes('tc led-button loop', {
            active: player.looping
          })}
        >
          LOOP
          </button>
        <button
          onMouseDown={app.toggleLoop}
          className={classes('tc led-button sel', {
            active: app.hasLoop
          })}
        >
          SEL
          </button>
        <button
          onMouseDown={app.toggleSnapping}
          className={classes('tc led-button snap', {
            active: app.snapping
          })}
        >
          SNAP
        </button>
        <button
          onMouseDown={app.toggleFollowing}
          className={classes('tc led-button scroll', {
            active: app.following
          })}
        >
          FOLLOW
        </button>
      </div>
    )
  }
}


@observer
export class PlayerTime extends React.Component {
  formatTime(time) {
    return `${0 | (time / 60)}:${(time % 60).toFixed(1).padStart(4, "0")}`;
  }
  get totalTime() {
    const { app } = this.props;
    return this.formatTime(app.tune?.length);
  }

  render() {
    return (<div className="tc time">
      <Time object={app.player} prop="playbackTime" className="playback"/>
      <Time object={app.player} prop="beginTime" className="begin"/>
      <Time object={app.player} prop="endTime" className="end"/>
    </div>)
  }
}

@observer
export class Time extends React.Component {
  render() {
    const { object, prop, className } = this.props;
    return (
      <span className={className}>
        <time>{formatTime(object[prop])}</time>
      </span>
    )
  }
}


@observer
export class PlayerLinks extends React.Component {

  render() {
    const { app } = this.props;
    return (
      <div className="tc links">
        <input type="file" id="open-tune" style={{
          position: "fixed",
          left: "-100vw"
        }}
          accept=".tune"
          onChange={e => {
            app.openTune(e.target.files[0]);
          }}

        />
        <label className="tc small-button open" htmlFor="open-tune">
          OPEN TUNE
        </label>
        <button className="tc small-button save"
          onClick={e => app.saveTune()}
        >
          SAVE TUNE
        </button>
        <button className="tc small-button midi"
          onClick={e => app.exportMidi()}
        >
          EXPORT MIDI
        </button>


        <button className="tc small-button mp3 hidden">
          EXPORT MP3
        </button>
      </div>)
  }
}


@observer
export class RadioLinks extends React.Component {
  render() {
    const { obj, prop, options } = this.props;
    let list = [];
    if (Array.isArray(options)) {
      list = options.map(k => [k, k])
    } else {
      list = Object.entries(options);
    }

    return list.map(([k, v]) => <span
      key={k}
      className={classes('tc link', {
        active: obj[prop] === k
      })}
      onClick={action(e => obj[prop] = k)}
    >
      {v}
    </span>)
  }
}

