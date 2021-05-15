
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
import { AppContext, formatTime } from "./Utils";
import { pitchToText } from "../lib/utils";
import { PlayerDropdown } from "./Player";


@observer
export class Status extends React.Component {
  static contextType = AppContext;
  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  @computed get messages() {
    const { app } = this.context;
    return {
      time: formatTime(app.mouseTime),
      track: app.mouseTrackIndex,
      pitch: app.mouseTrackPitch && `${pitchToText(app.mouseTrackPitch)} (${app.mouseTrackPitch})`,
      //note: app.mouseNote && `${pitchToText(app.mouseNote.note)}`
    }
  }
  render() {
    const { app } = this.context;
    return (
      <div className="tc status">
        <span className="message">
          <PlayerDropdown/>
        </span>
        {Object.entries(this.messages).map(([key,value])=>(
          <span key={key} className="message" >
            <span className="label">{key}</span>
            <span className="value">{value}</span>
          </span>
        ))}
      </div>
    )
  }
}

