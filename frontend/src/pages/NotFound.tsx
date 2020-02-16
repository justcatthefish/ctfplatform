import * as React from "react";

const NotFoundPage: React.FunctionComponent<INotFoundPageProps> = ( ) => {
    return (
        <div className={"page"}>
            <h1 className={"mainTitle"}>not found</h1>
        </div>
    )
};

interface INotFoundPageProps {

}

export { NotFoundPage };