import * as React from "react";
import {inject, observer} from "mobx-react";
import {observable} from "mobx";

import {IScoreboard, ITask} from "@store/CtfStore";
import {IRootStore} from "@store/index";

import Loader from "@components/Loader";
import Footer from "@components/Footer";
import Timer from "@components/Timer";
import Link from "@components/Link";

import noAvatar from "../assets/images/no_avatar_scoreboard.png";
import solveMedal1 from "../assets/images/scoreboard_medal_1.png";
import solveMedal2 from "../assets/images/scoreboard_medal_2.png";
import solveMedal3 from "../assets/images/scoreboard_medal_3.png";
import solveMedalAny from "../assets/images/scoreboard_medal_any.png";

import "@styles/scoreboard.scss";

interface IComputedScoreboard {
    sortedCategories: Map<string, {
        first_task_id: number;
        category: string;
        count: number;
    }>;
    sortedTasks: ITask[];
    sortedRanking: IScoreboard[];
    taskSolvedTeams: Map<number, {
       team_id: number;
       created_at: Date;
    }[]>;
    maxRanking: number;
}


@inject("store")
@observer
export class ScoreboardPage extends React.Component<IScoreboardPageProps, {}> {
    @observable rankingOffset: number = 20;

    async componentDidMount() {
        await Promise.all([
            this.props.store.ctf.fetchTasks(),
            this.props.store.ctf.fetchScoreboard(),
            this.props.store.ctf.fetchInfo(),
        ]);
    }

    trunc( text: string, length: number ) {
        return (text.length > length) ? text.substr(0, length-1) + '...' : text;
    }

    computedScoreboard(): IComputedScoreboard {
        const sortedCategories: Map<string, {
            first_task_id: number;
            category: string;
            count: number;
        }> = new Map();
        const taskSolvedTeams: Map<number, {
            team_id: number;
            created_at: Date;
        }[]> = new Map();

        const sortedRanking = Array.from(this.props.store.ctf.scoreboard.values());
        const sortedTasks = Array.from(this.props.store.ctf.tasks.values()).sort((a, b) => {
            if(a.api.categories[0].name < b.api.categories[0].name)
                return -1;
            if(a.api.categories[0].name > b.api.categories[0].name)
                return 1;

            if(a.api.id < b.api.id)
                return -1;
            if(a.api.id > b.api.id)
                return 1;

            return 0;
        });
        for(const task of sortedTasks) {
            const cat = task.api.categories[0];
            const g = sortedCategories.get(cat.id);
            sortedCategories.set(cat.id, {
                category: cat.name,
                count: ((g && g.count) || 0) + 1,
                first_task_id: ((g && g.first_task_id) || task.id),
            });
        }
        for(const scoreboard of sortedRanking) {
            for(const task of scoreboard.api.team.task_solved) {
                if(!taskSolvedTeams.has(task.id)) {
                    taskSolvedTeams.set(task.id, []);
                }
                const g = taskSolvedTeams.get(task.id);
                g && g.push({
                    team_id: scoreboard.api.team.id,
                    created_at: task.created_at,
                });
            }
        }
        for(const key of taskSolvedTeams.keys()) {
            const g = taskSolvedTeams.get(key);
            g && g.sort((a, b) => {
                return (+a.created_at) - (+b.created_at);
            });
        }
        return {
            sortedCategories: sortedCategories,
            sortedTasks: sortedTasks,
            sortedRanking: sortedRanking.slice(0, this.rankingOffset),
            taskSolvedTeams: taskSolvedTeams,
            maxRanking: sortedRanking.length,
        }
    }

    onLoadMore = () => {
        this.rankingOffset = this.rankingOffset + 20;
    };

    render() {
        const {
            sortedCategories, sortedTasks,
            sortedRanking, taskSolvedTeams,
            maxRanking,
        } = this.computedScoreboard();

        return (
            <div className={"page scoreboard"}>
                <div className={"inner"}>
                    <h1 className={"mainTitle"}>Scoreboard</h1>

                    {(this.props.store.ctf.tasksState === "pending" || this.props.store.ctf.scoreboardState === "pending") && <Loader text={"Loading scoreboard"} />}
                    {(this.props.store.ctf.tasksState === "error" || this.props.store.ctf.scoreboardState === "error") && <Loader text={"Error during loading scoreboard"} />}
                    {this.props.store.ctf.tasksState === "done" && this.props.store.ctf.scoreboardState === "done" && (<>
                        {this.props.store.ctf.scoreboardIsFreeze && (
                            <>
                                <h4>Scoreboard has been frozen.</h4>
                                <span className={"unfreeze"}>unfreezed in</span>
                                <Timer date={this.props.store.ctf.info.end}/>
                            </>
                        )}

                        <div className={"table"}>
                            <table>
                                <thead>
                                    <tr>
                                        <th colSpan={4} />
                                        {Array.from(sortedCategories.values()).map(row => (
                                            <th key={row.category} colSpan={row.count}><div>{row.category}</div></th>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th colSpan={4} />

                                        {sortedTasks.map(task => {
                                            const cat = sortedCategories.get(task.api.categories[0].id);
                                            return (
                                                <th key={task.id}
                                                    className={((cat && cat.first_task_id) || 0) === task.id ? "light" : ""}>
                                                    <div><span>{task.api.name}</span></div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Name</th>
                                        <th>Score</th>
                                        <th>Solves</th>

                                        {sortedTasks.map(task => {
                                            const cat = sortedCategories.get(task.api.categories[0].id);
                                            return (
                                                <th key={task.id}
                                                    className={((cat && cat.first_task_id) || 0) === task.id ? "light" : ""}>
                                                    {task.api.points}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                <tbody>
                                    {sortedRanking.map((scoreboard, scoreboardPos) => {
                                        return (
                                            <tr key={scoreboard.id}>
                                                <td>{scoreboardPos+1}</td>
                                                <td className={"left"}>
                                                    {scoreboard.api.team.avatar && (
                                                        <img src={scoreboard.api.team.avatar} alt={""} className={"avatar"} />
                                                    )}
                                                    {!scoreboard.api.team.avatar && (
                                                        <img src={noAvatar} alt={""} className={"avatar"} />
                                                    )}
                                                    <Link href={`/team/${scoreboard.api.team.id}`} title={scoreboard.api.team.name} child={this.trunc(scoreboard.api.team.name, 15)}/>
                                                </td>
                                                <td>{scoreboard.api.points}</td>
                                                <td>{scoreboard.api.team.task_solved.length}</td>

                                                {sortedTasks.map(task => {
                                                    const cat = sortedCategories.get(task.api.categories[0].id);
                                                    const solvedTeams = taskSolvedTeams.get(task.id);
                                                    const solvedPos = (solvedTeams && solvedTeams.findIndex(team => team.team_id === scoreboard.api.team.id)+1) || -1;
                                                    return (
                                                        <td key={task.id}
                                                            className={((cat && cat.first_task_id) || 0) === task.id ? "light" : ""}>
                                                            {solvedPos === 1 && (
                                                                <img src={solveMedal1} alt={""} />
                                                            )}
                                                            {solvedPos === 2 && (
                                                                <img src={solveMedal2} alt={""} />
                                                            )}
                                                            {solvedPos === 3 && (
                                                                <img src={solveMedal3} alt={""} />
                                                            )}
                                                            {solvedPos >= 4 && (
                                                                <img src={solveMedalAny} alt={""} />
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {this.rankingOffset < maxRanking && (
                            <div onClick={this.onLoadMore} className={"more"}>Load more</div>
                        )}
                    </>)}

                    <Footer />
                </div>
            </div>
        )
    }
}

interface IScoreboardPageProps {
    store: IRootStore
}