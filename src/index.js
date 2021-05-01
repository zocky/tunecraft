import React from "react";
import { render } from "react-dom";
import { App } from "./components/App";
import "./styles/index.less";

import { AppState } from "./lib/AppState";

render(<App app={new AppState()}/>, document.getElementById("root"));

