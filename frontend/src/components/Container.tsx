import * as React from "react";
import {inject, observer} from "mobx-react";
import {RouterStore} from "mobx-react-router";

import {
    AnnouncementsPage,
    ChallengesPage,
    HomePage,
    LoginPage,
    NotFoundPage,
    RegisterPage,
    RulesPage,
    ScoreboardPage,
    SettingsPage,
    TeamPage,
    TeamsPage
} from "../pages";
import {UnavailablePage} from "../pages/UnavailablePage";

const Container: React.FunctionComponent<IContainerProps> = ( { routing}: IContainerProps ) => {
    if( !routing )
        return null;

    const { location, push } = routing;

    const componentDict: { [key: string]: any; } = {
        "/": HomePage,
        "/challenges": ChallengesPage,
        "/scoreboard": ScoreboardPage,
        // "/challenges": UnavailablePage,
        // "/scoreboard": UnavailablePage,
        "/rules": RulesPage,
        "/teams": TeamsPage,
        "/news": AnnouncementsPage,
        "/settings": SettingsPage,
        "/login": LoginPage,
        "/register": RegisterPage,
        "/404": NotFoundPage,
    };

    const teamRegex = new RegExp(`^\/team\/(\\d+)$`);

    if( teamRegex.test(location.pathname) ) {
        const matches = teamRegex.exec( location.pathname );

        if( matches )
            return <TeamPage id={parseInt(matches[ 1 ], 10)} />
    }

    let ComponentTag = componentDict[location.pathname];

    if (!ComponentTag) {
        push('/404');
        ComponentTag = componentDict['/404'];
    }

    return <ComponentTag />;

};

interface IContainerProps {
    routing?: RouterStore;
}

export default inject("routing")(observer(Container))