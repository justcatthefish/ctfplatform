import * as React from "react";
import {inject, observer} from "mobx-react";
import {observable} from "mobx";

import {IRootStore} from "@store/index";
import {ITask} from "@store/CtfStore";

import Loader from "@components/Loader";
import Challenge from "@components/Challenge";
import Modal from "@components/Modal";
import Footer from "@components/Footer";

import "@styles/challenges.scss";
import ChallengeModal from "@components/ChallengeModal";
import FlagSubmit from "@components/FlagSubmit";

@inject("store")
@observer
export class ChallengesPage extends React.Component<IChallengesPageProps, {}> {
    @observable selectedCategories: Set<string> = new Set();
    @observable showUnsolved: boolean = false;

    // Modal
    @observable fetchedTask?: ITask;

    async componentDidMount( ) {
        await this.props.store.ctf.fetchTasks();
        await this.props.store.ctf.fetchMyTeam();
    }

    onUnsolved = () => {
        this.showUnsolved = !this.showUnsolved;
    };

    onCategory = (categoryId: string) => () => {
        if(this.selectedCategories.has(categoryId)) {
            this.selectedCategories.delete(categoryId)
        } else {
            this.selectedCategories.clear();
            this.selectedCategories.add(categoryId)
        }
    };

    onClickChallenge = (challengeId: number) => () => {
        const { store: { ctf: { tasks } } } = this.props;

        if(tasks.has(String(challengeId)))
            this.fetchedTask = tasks.get(String(challengeId));
    };

    onClickCloseChallenge = ( ) => {
        if(!!this.fetchedTask)
            this.fetchedTask = undefined;
    };

    render( ) {
        return (
            <div className={"page challenges"}>
                <div className={"inner"}>
                    <h1 className={"mainTitle"}>Challenges</h1>

                    {this.props.store.ctf.tasksState === "pending" && <Loader text={"Loading challenges"} />}
                    {this.props.store.ctf.tasksState === "error" && <Loader text={"Error during loading challenges"} />}
                    {this.props.store.ctf.tasksState === "done" && <>
                        <header>
                            <ul>
                                {Array.from(this.props.store.ctf.categories.values()).map((category) => (
                                    <li onClick={this.onCategory(category.id)}
                                        key={category.id}
                                        className={`category ${
                                            (this.selectedCategories.size == 0 || 
                                                this.selectedCategories.has(category.id)
                                            ) ? "" : "inactive"
                                        }`}
                                        style={{backgroundColor: `#${category.color}`}}>
                                        {category.name.toUpperCase()}
                                    </li>
                                ))}
                                <li className={"unsolved"}>
                                    <input type={"checkbox"} id={"iOnlyUnsolved"} checked={this.showUnsolved} onChange={this.onUnsolved} />

                                    <label htmlFor={"iOnlyUnsolved"}>
                                        <span />
                                        <p>Only unsolved</p>
                                    </label>
                                </li>
                            </ul>

                            <FlagSubmit />
                        </header>

                        <div className={"list"}>
                            {Array.from(this.props.store.ctf.filteredTasks(
                                this.selectedCategories,
                                this.showUnsolved,
                            ).values()).map((challenge) => (
                                <Challenge key={challenge.id} info={challenge} onClick={this.onClickChallenge(challenge.id)} />
                            ))}
                        </div>

                        {!!this.fetchedTask && <Modal closable={true} active={true} onBackgroundClick={this.onClickCloseChallenge} onCloseButtonClick={this.onClickCloseChallenge}>
                            <ChallengeModal task={this.fetchedTask} />
                        </Modal>}
                    </>}

                    <Footer />
                </div>
            </div>
        )
    }
}

interface IChallengesPageProps {
    store: IRootStore;
}