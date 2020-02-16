import * as React from "react";

export class UnavailablePage extends React.Component<{}, {}> {
    render() {
        return (
            <div className={"page"}>
                <div className={"inner"}>
                    <h1 className={"mainTitle center"}>Unavailable yet</h1>
                </div>
            </div>
        );
    }
}
