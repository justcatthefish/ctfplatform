import * as React from "react";

import "@styles/modal.scss";

const Modal: React.FunctionComponent<IModalProps> = ( props ) => {
    if( typeof props.closable === "undefined" )
        props.closable = true;

    if( !props.active )
        return null;

    function onBackgroundClick( e: React.MouseEvent<HTMLDivElement> ) {
        if( e.target instanceof Element && !!props.closable ) {
            if( e.target.className === "modalBackground" ) {
                e.stopPropagation();

                if( typeof props.onBackgroundClick === "function" )
                    props.onBackgroundClick( e );
            }
        }
    }

    function onCloseButtonClick( e: React.MouseEvent<HTMLDivElement> ) {
        if( e.target instanceof Element && !!props.closable ) {
            e.stopPropagation();

            if( typeof props.onCloseButtonClick === "function" )
                props.onCloseButtonClick( e );
        }
    }

    return (
        <div className={"modalBackground"} onClick={onBackgroundClick}>
            <div className={"modal"}>
                {!!props.closable && <div className={"close"} onClick={onCloseButtonClick} />}

                <div className={"body"}>
                    {props.children}
                </div>
            </div>
        </div>
    );
};

interface IModalProps {
    closable?: boolean;
    active?: boolean;
    onBackgroundClick?: ( e: React.MouseEvent<HTMLDivElement> ) => void;
    onCloseButtonClick?: ( e: React.MouseEvent<HTMLDivElement> ) => void;
}

export default Modal;