import * as React from "react";
import {inject, observer} from "mobx-react";
import {IRootStore} from "@store/index";

import Footer from "@components/Footer";

import defaultAvatar from "../assets/images/avatar_default_big.png";
import flagNotFound from "../assets/images/no_country.png";

import {Countries} from "@consts/country";

import "@styles/team.scss";
import {GetTeam, ITeamResponse} from "@libs/api";
import {observable} from "mobx";
import Loader from "@components/Loader";
import {formatDate} from "@libs/date";

@inject("store")
@observer
export class TeamPage extends React.Component<ITeamPageProps, {}> {
    @observable teamState: string = "none";
    @observable team: ITeamResponse|null = null;

    async componentDidMount() {
        this.fetchTeam(this.props.id);
        this.props.store && this.props.store.ctf.fetchScoreboard();
        this.props.store && this.props.store.ctf.fetchTasks();
    }

    async componentDidUpdate(prevProps: Readonly<ITeamPageProps>) {
        if(prevProps.id !== this.props.id) {
            this.fetchTeam(this.props.id);
        }
    }

    fetchTeam(teamId: number) {
        this.teamState = "pending";
        GetTeam(teamId).then(([data, err]) => {
            if(err !== null) {
                this.teamState = "error";
                console.error('fetch err', err);
                return;
            }
            this.team = data;
            this.teamState = "done";
        }).catch((err) => {
            console.error('fetch err', err);
            this.teamState = "error";
        })
    };

    render() {
        if(!this.props.store) {
            return null;
        }

        let rankingData = null;
        let _teamRanking = 0;
        let teamRanking = 0;
        if(this.team) {
            rankingData = this.props.store.ctf.scoreboard.get(String(this.team.id));
            for(const row of this.props.store.ctf.scoreboard.values()) {
                _teamRanking += 1;
                if(row.id === this.team.id) {
                    teamRanking = _teamRanking;
                    break;
                }
            }
        }

        return (
            <div className={"page team"}>
                <div className={"inner"}>
                    {this.teamState === "pending" && <><Loader text={"Loading team"} /></>}
                    {this.teamState === "error" && <><Loader text={"Error during loading team"} /></>}
                    {this.teamState === "done" && this.team !== null && (<>
                        <div className={"mainTitle normal"}>{this.team.name}</div>
                        <header>
                            <img src={this.team.avatar || defaultAvatar} alt={""} />
                            <ul>
                                <li className={"ranking"}>
                                    <h2>Ranking</h2>
                                    <p className={"blue"}>{teamRanking || "-"} / {this.props.store.ctf.scoreboard.size}</p>
                                </li>
                                {this.team.website && <li className={"url"}>
                                    <h2>Url</h2>
                                    <p className={"blue"}><a href={this.team.website} title={this.team.name + " website"}>{this.team.website}</a></p>
                                </li>}
                                <li className={"score"}>
                                    <h2>Score</h2>
                                    <p className={"blue"}>{(rankingData && rankingData.api.points) || "-"}</p>
                                </li>
                                <li className={"country"}>
                                    <h2>Country</h2>
                                    <p>
                                        {Countries[this.team.country.toUpperCase()]}
                                        {this.team.country && (
                                            <img src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.4.3/flags/4x3/${this.team.country.toLowerCase()}.svg`} alt={this.team.country + " flag"} />
                                        )}
                                        {!this.team.country && (
                                            <img src={flagNotFound} alt={""} />
                                        )}
                                    </p>
                                </li>
                                <li className={"affiliation"}>
                                    <h2>Affiliation</h2>
                                    <p>{this.team.affiliation || "---"}</p>
                                </li>
                            </ul>
                        </header>

                        <div className={"result"}>
                            <h2>Challenges</h2>
                            <h4>Solved <span>{(this.team.task_solved && this.team.task_solved.length) || 0}</span> / <span>{this.props.store.ctf.tasks.size}</span> Total</h4>
                        </div>

                        <div className={"table"}>
                            <table>
                                <thead>
                                    <tr><th>Name</th><th>Score</th><th>Time</th></tr>
                                </thead>
                                <tbody>
                                    {this.team.task_solved && this.team.task_solved.map(task => {
                                        const taskObj = (this.props.store && this.props.store.ctf.tasks.get(String(task.id))) || null;
                                        return (
                                            <tr key={task.id}>
                                                <td>{task.name}</td>
                                                <td>{(taskObj && taskObj.api.points) || "-"}</td>
                                                <td>{formatDate(new Date(task.created_at))}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>)}

                    <Footer />
                </div>
            </div>
        )
    }
}

interface ITeamPageProps {
    store?: IRootStore;
    id: number;
}