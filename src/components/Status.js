
import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";
import { formatTime } from "./Utils";
import { pitchToText } from "../lib/utils";


@observer
export class Status extends React.Component {
  constructor(...args) {
    super(...args);
    this.props.app.trackComponents[this.props.idx] = this;
    makeObservable(this);
  }

  @computed get messages() {
    const { app } = this.props;
    return {
      time: formatTime(app.mouseTime),
      track: app.mouseTrackIndex,
      pitch: app.mouseTrackPitch && `${pitchToText(app.mouseTrackPitch)} (${app.mouseTrackPitch})`,
      //note: app.mouseNote && `${pitchToText(app.mouseNote.note)}`
    }
  }
  render() {
    const { app } = this.props;
    return (
      <div className="tc status">
        {Object.entries(this.messages).map(([key,value])=>(
          <span key={key} className="message">
            <span className="label">{key}</span>
            <span className="value">{value}</span>
          </span>
        ))}
      </div>
    )
  }
}

