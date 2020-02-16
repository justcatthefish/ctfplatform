import * as React from "react";
import {inject, observer} from "mobx-react";
import {observable} from "mobx";
import {RouterStore} from "mobx-react-router";

import {IRootStore} from "@store/index";
import {SetLogout} from "@libs/api";

import "@styles/navbar.scss";

@inject("routing", "store")
@observer
export default class Navbar extends React.Component<INavbarProps, { }> {
    @observable menuActive: boolean = false;
    @observable isMobile: boolean = window.innerWidth < 980;

    private timeout: any;

    componentDidMount(): void {
        window.addEventListener("resize", this.onResize);
    }

    componentWillUnmount(): void {
        window.removeEventListener("resize", this.onResize);

        if( this.timeout )
            clearTimeout( this.timeout );
    }

    render( ) {
        const { routing, store } = this.props;

        return (
            <nav className={"mainNavbar"}>
                <div className={"inner"}>
                    <div className={"rwdLogo"} />
                    <div className={"rwdMenu"} onClick={this.toggleMenu} />

                    <ul className={"main" + (this.menuActive ? " active" : "")}>
                        <li className={"logo"}><a href={"/"} title={"Home"} onClick={this.onClick} /></li>
                        <li className={routing && routing.location.pathname === "/" ? "active" : ""}><a href={"/"} title={"Home"} onClick={this.onClick}>home</a></li>
                        <li className={routing && routing.location.pathname === "/challenges" ? "active" : ""}><a href={"/challenges"} title={"Challenges"} onClick={this.onClick}>challenges</a></li>
                        <li className={routing && routing.location.pathname === "/scoreboard" ? "active" : ""}><a href={"/scoreboard"} title={"Scoreboard"} onClick={this.onClick}>scoreboard</a></li>
                        <li className={routing && routing.location.pathname === "/rules" ? "active" : ""}><a href={"/rules"} title={"Rules"} onClick={this.onClick}>rules</a></li>
                        <li className={routing && routing.location.pathname === "/teams" ? "active" : ""}><a href={"/teams"} title={"Teams"} onClick={this.onClick}>teams</a></li>
                        <li className={routing && routing.location.pathname === "/news" ? "active" : ""}>
                            <a href={"/news"} title={"News"} onClick={this.onClick}>news</a>
                            {store && store.ctf.newAnnouncementsCount() > 0 && (
                                <span className={"badge"}>{store.ctf.newAnnouncementsCount()}</span>
                            )}
                        </li>
                        {this.menuActive && !!store && !!store.ctf.isLoggedIn && <>
                            <li className={routing && routing.location.pathname === "/settings" ? "active" : ""}><a href={"/settings"} title={"Settings"} onClick={this.onClick}>settings</a></li>
                            <li><a href={"#"} title={"Logout"} onClick={this.onLogout}>logout</a></li>
                        </>}

                        {this.isMobile && this.menuActive && !!store && !store.ctf.isLoggedIn && <>
                            <li className={routing && routing.location.pathname === "/login" ? "active" : ""}><a href={"/login"} title={"Login"} onClick={this.onClick}>login</a></li>
                            <li className={routing && routing.location.pathname === "/register" ? "active" : ""}><a href={"/register"} title={"Register"} onClick={this.onClick}>register</a></li>
                        </>}
                    </ul>

                    {!this.isMobile && !!store && !!store.ctf.isLoggedIn && <ul>
                        <li className={routing && routing.location.pathname === "/settings" ? "active" : ""}><a href={"/settings"} title={"Settings"} onClick={this.onClick}>settings</a></li>
                        <li><a href={"#"} title={"Logout"} onClick={this.onLogout}>logout</a></li>
                    </ul>}

                    {!this.isMobile && !!store && !store.ctf.isLoggedIn && <ul>
                        <li className={routing && routing.location.pathname === "/login" ? "active" : ""}><a href={"/login"} title={"Login"} onClick={this.onClick}>login</a></li>
                        <li className={routing && routing.location.pathname === "/register" ? "active" : ""}><a href={"/register"} title={"Register"} onClick={this.onClick}>register</a></li>
                    </ul>}
                </div>
            </nav>
        );
    }

    private onResize = ( ) => {
        if( this.timeout )
            clearTimeout( this.timeout );

        this.timeout = setTimeout( ( ) => {
            const check = window.innerWidth < 980;

            if( this.isMobile !== check )
                this.isMobile = check;
        }, 100 );
    };

    private onClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault();

        const href = e.currentTarget.attributes.getNamedItem("href");

        if( !!href && !!this.props.routing )
            this.props.routing.push(href.value);
    };

    private toggleMenu = () => {
        this.menuActive = !this.menuActive;
    };

    private onLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        (async () => {
            let err;
            try {
                err = await SetLogout();
            } catch (e) {
                err = String(e);
            }
            if(err !== null) {
                // TODO: error logout?
                // return
            }
            this.props.store && this.props.store.ctf.removeUserSession();
            this.props.routing && this.props.routing.push('/');
        })();
    }

}

interface INavbarProps {
    routing?: RouterStore;
    store?: IRootStore;
}