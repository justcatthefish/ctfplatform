import * as React from "react";
import {inject, observer} from "mobx-react";
import {RouterStore} from "mobx-react-router";

import {IRootStore} from "@store/index";

import Timer from "@components/Timer";
import Footer from "@components/Footer";

import TrailOfBitsLogo from "../assets/images/trail_of_bits_logo.png";
import WPLogo from "../assets/images/wp_logo.png";

import "@styles/homepage.scss";

@inject("routing", "store")
@observer
export class HomePage extends React.Component<IHomePageProps, {}> {
    async componentDidMount( ) {
        await this.props.store.ctf.fetchInfo( );
    }

    render( ) {
        const { store } = this.props;
        const now = new Date();

        return (
            <div className={"page homepage"}>
                <div className={"bg"}>
                    <span/>
                    <span/>
                </div>

                <div className={"inner"}>
                    <section className={"sec1"}>
                        <div className={"logo"}>
                            just
                            <span>ctf</span>
                            2019
                        </div>
                        <div className={"text"}>
                            Capture The <span className={"flag"} /> Competition
                        </div>

                        <div className={"stats"}>
                            {store.ctf.info.start > now && (
                                <>
                                    <div className={"stat"}>
                                        <div>{store.ctf.info.teams_count}</div>
                                        <p>Teams</p>
                                    </div>

                                    <div className={"stat"}>
                                        <div>{store.ctf.info.countries_count}</div>
                                        <p>Countries</p>
                                    </div>
                                </>
                            )}
                            {store.ctf.info.start <= now && (
                                <>
                                    <div className={"stat"}>
                                        <div>{store.ctf.info.flags_count}</div>
                                        <p>Flags submitted</p>
                                    </div>

                                    <div className={"stat"}>
                                        <div>{store.ctf.info.teams_count}</div>
                                        <p>Teams registered</p>
                                    </div>

                                    <div className={"stat"}>
                                        <div>{store.ctf.info.tasks_unsolved_count}</div>
                                        <p>Unsolved challenges</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={"timer"}>
                            {store.ctf.info.start > now && (
                              <>
                                  <h4>Starts in</h4>
                                  <Timer date={store.ctf.info.start}/>
                              </>
                            )}
                            {store.ctf.info.start <= now && now <= store.ctf.info.end && (
                              <>
                                  <h4>Ends in</h4>
                                  <Timer date={store.ctf.info.end}/>
                              </>
                            )}
                            {store.ctf.info.end < now && (
                              <>
                                  <h4>CTF is over!</h4>
                                  <Timer date={store.ctf.info.end}/>
                              </>
                            )}
                        </div>

                        {!store.ctf.isLoggedIn && <a href={"/register"} className={"register"} onClick={this.redirectToRegister}>Register</a>}
                    </section>

                    <section className={"sec3"}>
                        <h1 className={"mainTitle"}>Info</h1>

                        <ul>
                            <li>
                                <h4>Start:</h4>
                                <p>Friday, 20th of December 20:00 UTC</p>
                            </li>
                            <li>
                                <h4>Time:</h4>
                                <p>37h</p>
                            </li>
                            <li>
                                <h4>Format:</h4>
                                <p>jeopardy on-line</p>
                            </li>
                            <li>
                                <h4>Discord:</h4>
                                <p><a href={"https://discord.gg/phyqdh6"} title={"Discord"} target={"_blank"}>https://discord.gg/c7uEsq</a></p>
                            </li>
                        </ul>
                    </section>

                    <section className={"sec4"}>
                        <h1 className={"mainTitle"}>Prizes</h1>

                        <ul>
                            <li>
                                <div>
                                    <h4>1st place</h4>
                                    <p>1,337 USD</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <h4>2nd place</h4>
                                    <p>777 USD</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <h4>3rd place</h4>
                                    <p>337 USD</p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section className={"sec5"}>
                        <h1 className={"mainTitle"}>Sponsors</h1>

                        <ul>
                            <li className={"tob"}><a href={"https://cutt.ly/Ze6VVqe"} rel={"noreferrer noopener"} target={"_blank"}><img src={TrailOfBitsLogo} alt={"Trail of Bits"} /></a></li>
                            <li className={"wp"}><a href={"https://cutt.ly/Ce6VVim"} rel={"noreferrer noopener"} target={"_blank"}><img src={WPLogo} alt={"Wirtualna Polska"} /></a></li>
                        </ul>
                    </section>

                    <section className={"sec6"}>
                        <ul>
                            <li className={"email"}><a href={"mailto:justcatthefish@gmail.com"} title={""}>justcatthefish@gmail.com</a></li>
                            <li className={"twitter"}><a href={"https://twitter.com/justcatthefish"} title={""} target={"_blank"}>@justcatthefish</a></li>
                        </ul>
                    </section>

                    <Footer />
                </div>
            </div>
        )
    }

    redirectToRegister = ( e: React.MouseEvent<HTMLAnchorElement> ) => {
        e.preventDefault();

        const href = e.currentTarget.attributes.getNamedItem("href");

        if( !!href && !!this.props.routing )
            this.props.routing.push(href.value);
    };
}

interface IHomePageProps {
    routing: RouterStore;
    store: IRootStore;
}
