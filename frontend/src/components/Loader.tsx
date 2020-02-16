import * as React from "react";

const Loader: React.FunctionComponent<LoaderProps> = ({ text, position = "center", background = false, small = false }: LoaderProps) => {
    if (!text || !text.length)
        return null;

    const classes: string[ ] = ["loader", position];

    if( small )
        classes.push( "small" );

    const loader = <div className={classes.join(" ")}>{!!text && <p>{text}</p>}</div>;

    return background ? <div className={"loaderBackground"}>{loader}</div> : loader;
};

type LoaderProps = {
    text?: string;
    position?: "center" | "inline";
    background?: boolean;
    small?: boolean;
};

export default Loader;
