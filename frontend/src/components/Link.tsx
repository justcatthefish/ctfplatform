import * as React from "react";
import {inject, observer} from "mobx-react";
import {RouterStore} from "mobx-react-router";

interface IProps {
    routing?: RouterStore;
    href: string;
    title: string;
    child: string;
}

@inject("routing")
@observer
class Link extends React.Component<IProps, {}> {
    render() {
        return (
            <a href={this.props.href} title={this.props.title} onClick={this.onClick}>{this.props.child}</a>
        );
    }

    private onClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault();

        const href = e.currentTarget.attributes.getNamedItem("href");
        if( !!href && !!this.props.routing )
            this.props.routing.push(href.value);
    };
}

export default Link;