import * as React from "react";
import {observer} from "mobx-react";

import {ITask} from "@store/CtfStore";
import ReactMarkdown from "react-markdown";
import {observable} from "mobx";
import Loader from "@components/Loader";
import {ErrorCodes, GetTaskSolvers, ITaskAuditResponse, SetFlag, SetSettings} from "@libs/api";
import {formatDate} from "@libs/date";
import Link from "@components/Link";
import FlagSubmit from "@components/FlagSubmit";

interface IProps {
    task: ITask;
}

@observer
class ChallengeModal extends React.Component<IProps, {}> {
    @observable activeTab: number = 1;
    @observable solversState: string = "none";
    @observable solvers: ITaskAuditResponse[] = [];

    async componentDidMount() {
        this.fetchSolvers();
    }

    onChangeTab = (tabId: number) => ( ) => {
        if(this.activeTab !== tabId)
            this.activeTab = tabId;
    };

    fetchSolvers = () => {
        this.solversState = "pending";
        GetTaskSolvers(this.props.task.id).then(([data, err]) => {
            if(err !== null) {
                this.solversState = "error";
                console.error('fetch err', err);
                return;
            }
            this.solvers = data;
            this.solversState = "done";
        }).catch((err) => {
            console.error('fetch err', err);
            this.solversState = "error";
        });
    };

    render() {
        const { task } = this.props;
        const finished = task.hasTaskSolved();
        return (
            <div className={"tabs"}>
                <header>
                    <div className={this.activeTab === 1 ? "active" : ""} onClick={this.onChangeTab(1)}>Challenges</div>
                    <div className={this.activeTab === 2 ? "active" : ""} onClick={this.onChangeTab(2)}>Solves ({task.api.solvers})</div>
                </header>

                <div className={"content info" + (this.activeTab === 1 ? " active" : "")}>
                    <h2 className={"title"}>{task.api.name}</h2>

                    <header>
                        <div className={"points"}>Points: {task.api.points}</div>
                        <div className={"first"}>{this.solvers.length > 0 ? this.solvers[0].name : "---"}</div>
                        <div className={"categories"}>{Array.from(task.api.categories.values()).map(category => category.name).join(", ").toUpperCase()}</div>
                    </header>

                    <div className={"description scrollable"}>
                        <ReactMarkdown source={task.api.description} escapeHtml={true} />
                    </div>

                    <div className={"flag"}>
                        {finished && (
                            <p className={"solved"}>Challenge solved</p>
                        )}
                        {!finished && <FlagSubmit />}
                    </div>
                </div>

                <div className={"content solves" + (this.activeTab === 2 ? " active" : "")}>
                    <h2 className={"title"}>{task.api.name}</h2>

                    <div className={"table scrollable"}>
                        {this.solversState === "pending" && <><br /><br /><br /><br /><br /><br /><br /><br /><br /><Loader text={"Loading solvers"} /></>}
                        {this.solversState === "error" && <><br /><br /><br /><br /><br /><br /><br /><br /><br /><Loader text={"Error during loading solvers"} /></>}
                        {this.solversState === "done" && (
                            <table>
                                <thead>
                                <tr><th>#</th><th>Team</th><th>Submit time</th></tr>
                                </thead>
                                <tbody>
                                {this.solvers.map((solver, index) => (
                                    <tr key={solver.id}>
                                        <td>{index+1}</td>
                                        <td><Link href={`/team/${solver.id}`} title={solver.name} child={solver.name}/></td>
                                        <td>{formatDate(new Date(solver.created_at))}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default ChallengeModal;