import { trace, observable, computed, makeObservable, reaction, action } from "mobx";

export class ScrollerState {

  @observable
  width = 0;

  @computed
  get zoom() {
    return this.width / this.app.tuneTotalTime
  }

  getTime(x) {
    return x  / this.zoom;
  }

  getX(time) {
    return Math.round(time  * this.zoom);
  }

  @computed
  get viewLeft() {
    return this.getX(this.app.viewBeginTime);
  }

  @computed
  get viewWidth() {
    return this.getX(Math.min(this.app.tuneTotalTime,this.app.viewDuration));
  }

  @computed
  get viewRight() {
    return this.getX(this.app.viewEndTime);
  }

  @action
  centerView(x) {
    this.app.viewCenterTime = this.getTime(x);
  }

  @action moveView(deltaX) {
    this.app.moveViewTime(this.getTime(deltaX));
  }

  constructor(app) {
    this.app = app;
    makeObservable(this);
  }
}
