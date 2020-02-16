import { RootStore } from "@store/index";
import { createBrowserHistory } from "history";
import { Provider } from "mobx-react";
import { RouterStore, syncHistoryWithStore } from "mobx-react-router";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router } from "react-router";

import Container from "@components/Container";
import Navbar from "@components/Navbar";

import "@styles/main.scss";

if (__IS_DEV__) {
    console.log("dev mode");
} else {
    console.log("prod mode");
}

const storeStore = RootStore.create({});
const browserHistory = createBrowserHistory();
const routingStore = new RouterStore();

const stores = {
    routing: routingStore,
    store: storeStore,
};

const history = syncHistoryWithStore(browserHistory, routingStore);

ReactDOM.render((
    <Provider {...stores}>
        <Router history={history}>
            <Navbar/>
            <Container/>
        </Router>
    </Provider>
), document.getElementById("root"));
