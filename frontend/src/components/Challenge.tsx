import * as React from "react";
import {observer} from "mobx-react";

import {ITask} from "@store/CtfStore";

@observer
class Challenge extends React.Component<IChallengeProps, {}> {
    render() {
        const { info, onClick } = this.props;
        return (
            <div className={`challenge ${info.hasTaskSolved() ? "inactive" : ""}`} onClick={onClick}>
                <div className={"body"}>
                    <div className={"top"}>
                        {info.api.categories.map(category => (
                            <span key={category.id} style={{backgroundColor: `#${category.color}`}} />
                        ))}
                    </div>

                    <div className={"info"}>
                        <h2>{info.api.name}</h2>

                        <ul>
                            <li className={"points"}>Points: {info.api.points}</li>
                            <li className={"solved"}>Solved: {info.api.solvers}</li>
                        </ul>

                        <div className={"more"}>
                            <div className={"categories"}>
                                {Array.from(info.api.categories.values()).map(category => category.name).join(", ").toUpperCase()}
                            </div>

                            <div className={"difficult"}>
                                {info.api.difficult.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

interface IChallengeProps {
    info: ITask;
    onClick(): void;
}

export default Challenge;