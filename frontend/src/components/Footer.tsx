import * as React from "react";

const Footer: React.FunctionComponent<IFooterProps> = ( { sticky }: IFooterProps ) => {
    sticky = true;

    return (
        <footer className={"mainFooter" + ( !!sticky ? " sticky" : "")}>
            Copyright © 2019 JustCatTheFish All Rights Reserved
        </footer>
    )
};

interface IFooterProps {
    sticky?: boolean
}

export default Footer;