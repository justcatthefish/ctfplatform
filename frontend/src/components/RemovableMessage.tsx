import * as React from "react";

const RemovableMessage: React.FunctionComponent<IRemovableMessageProps> = ( props ) => {
    const [ renderMessage, setRenderMessage ] = React.useState(true);

    let timeout: any;

    React.useEffect( ( ) => {
        if( props.time && props.time > 0 ) {
            timeout = setTimeout( ( ) => {
                setRenderMessage( false );
            }, props.time );
        }

        return ( ) => {
            if( timeout )
                clearTimeout( timeout );
        }
    }, [ ] );

    return renderMessage ? <div className={props.type === "error" ? "errorMessage" : "successMessage"}>{props.children}</div> : null;
};

interface IRemovableMessageProps {
    type: "error" | "success",
    time?: number;
    children: string;
}

export default RemovableMessage;