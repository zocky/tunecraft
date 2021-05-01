
import React from "react";
import { observer } from "mobx-react";
import { action } from "mobx";

import './Player.less';
import { classes } from "../lib/utils";

@observer
export class Player extends React.Component {
  render() {
    const { app } = this.props;
    const { player } = app;
    if (!player) return null;
    return (
      <div className="tc player">
        <div className="controls">
          <button onClick={player.toggle}>
          ⏯
        </button>
          <button onClick={player.stop}>
          ⏹
        </button>
        </div>
        <div className="links">
          show:
          <RadioLinks obj={app} prop="viewerMode" options={["tracks","result"]}/>
        </div>
        <div className="time">
          <PlayerTime app={app}/>
        </div>
      </div>
    )
  }
}

@observer
class PlayerTime extends React.Component {
  formatTime(time) {
    return `${0 | (time / 60)}:${(time % 60).toFixed(1).padStart(4,"0")}`;
  }
  get totalTime() {
    const { app } = this.props;
    return this.formatTime(app.parsed?.length);
  }
  get playbackTime() {
    const { playbackTime } = this.props.app.player;
    return this.formatTime(playbackTime||0);
  }
  render() {
    return (<>
      {this.playbackTime} /
      {this.totalTime}
    </>)
  }
}

@observer
export class RadioLinks extends React.Component {
  render() {
    const {obj,prop,options} = this.props;
    let list = [];
    if (Array.isArray(options)) {
      list=options.map(k=>[k,k])
    } else {
      list = Object.entries(options);
    }
    
    return list.map(([k,v])=><span
      key={k}
      className={classes('tc link',{
        active: obj[prop] === k
      })}
      onClick={action(e=>obj[prop]=k)}
    >
      {v}
    </span>)
  }
}

