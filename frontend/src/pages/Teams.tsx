import * as React from "react";
import {inject, observer} from "mobx-react";

import Loader from "@components/Loader";
import Footer from "@components/Footer";

import {IRootStore} from "@store/index";
import {avatarUrl} from "@consts/index";

import expandImage from "../assets/images/expand_icon.png";
import flagNotFound from "../assets/images/no_country.png";

import "@styles/teams.scss";
import Link from "@components/Link";

@inject("store")
@observer
export class TeamsPage extends React.Component<ITeamsPageProps, {}> {

    async componentDidMount() {
        await this.props.store.ctf.fetchTeams();
    }

    render( ) {
        return (
            <div className={"page teams"}>
                <div className={"inner"}>
                    <h1 className={"mainTitle"}>Teams</h1>

                    {this.props.store.ctf.teamsState === "pending" && <Loader text={"Loading teams"} />}
                    {this.props.store.ctf.teamsState === "error" && <Loader text={"Error during loading teams"} />}
                    {this.props.store.ctf.teamsState === "done" && (<div className={"table"}>
                        <table>
                            <thead>
                            <tr><th>#</th><th>Avatar</th><th>Team name</th><th>Link</th><th>Affiliation</th><th>Country</th></tr>
                            </thead>
                            <tbody>
                            {this.props.store && Array.from(this.props.store.ctf.teams.values()).map((row, index) => (<tr key={row.id}>
                                <td>{row.id}</td>
                                <td><img src={row.api.avatar && row.api.avatar.length ? (avatarUrl + row.api.avatar) : flagNotFound} className={"avatar"}/></td>
                                <td><Link href={`/team/${row.api.id}`} title={row.api.name} child={this.trunc(row.api.name, 15)}/></td>
                                <td>
                                    {row.api.website && (
                                        <a href={row.api.website} rel={"noreferrer noopener"} target={"_blank"}><img width={15} height={15} src={expandImage} /></a>
                                    )}
                                </td>
                                <td>{row.api.affiliation && row.api.affiliation.length ? row.api.affiliation : "---"}</td>
                                <td>
                                    {row.api.country && (
                                        <img src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.4.3/flags/4x3/${row.api.country.toLowerCase()}.svg`} className={"flag"} />
                                    )}
                                    {!row.api.country && (
                                        <img src={flagNotFound} className={"flag"} />
                                    )}
                                </td>
                            </tr>))}
                            </tbody>
                        </table>
                    </div>)}

                    <Footer />
                </div>

            </div>
        );
    }

    trunc( text: string, length: number ) {
        return (text.length > length) ? text.substr(0, length-1) + '...' : text;
    }
}

interface ITeamsPageProps {
    store: IRootStore
}