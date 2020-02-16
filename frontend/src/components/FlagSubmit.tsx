import * as React from "react";
import {observer} from "mobx-react";

import {observable} from "mobx";
import {ErrorCodes, SetFlag} from "@libs/api";
import RemovableMessage from "@components/RemovableMessage";

@observer
class FlagSubmit extends React.Component<{}, {}> {
    private refFlag = React.createRef<HTMLInputElement>();

    @observable flagMessageOk: string = "";
    @observable flagMessageError: string = "";

    onFlagPressEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // on click enter
        if(e.keyCode == 13){
            this.onFlagSend();
        }
    };

    onFlagSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        this.onFlagSend();
    };

    async onFlagSend() {
        const value = (this.refFlag.current && this.refFlag.current.value) || '';
        if(!value) {
            return;
        }

        this.flagMessageOk = "";
        this.flagMessageError = "";
        let err = null;
        try {
            const err2 = await SetFlag({flag: value.trim()});
            if(err2) {
                err = ErrorCodes.toHumanMessage(err2);
            }
        } catch (e) {
            console.error('send err', e);
            err = String(e);
        }
        if(err === null) {
            this.flagMessageError = "";
            this.flagMessageOk = "Congratulation! You solved the task.";
        } else {
            this.flagMessageOk = "";
            this.flagMessageError = err;
        }
    }

    render() {
        return (
            <div className={"submitFlag"}>
                {this.flagMessageError && <RemovableMessage type={"error"} time={3000}>{this.flagMessageError}</RemovableMessage>}
                {this.flagMessageOk && <RemovableMessage type={"success"} time={3000}>{this.flagMessageOk}</RemovableMessage>}

                <div className={"form"}>
                    <input ref={this.refFlag} onKeyDown={this.onFlagPressEnter} type={"text"} placeholder={"Flag"} />
                    <button onClick={this.onFlagSubmit} type={"submit"} />
                </div>
            </div>
        );
    }
}

export default FlagSubmit;
