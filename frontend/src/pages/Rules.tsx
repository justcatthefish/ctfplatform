import * as React from "react";

import Footer from "@components/Footer";

import "@styles/rules.scss";

export const RulesPage: React.FunctionComponent = ( ) => (
    <div className={"page rules"}>
        <div className={"inner"}>
            <h1 className={"mainTitle"}>Rules</h1>

            <ol>
                <li>Each team is allowed to participate under one account and each member must belong to exactly one team. Teams may consist of any number of members.</li>
                <li>During the contest, sharing flags, solutions, hints or asking for help outside the team is prohibited.</li>
                <li>If you have questions about challenges or you believe that you found a correct flag, but the system is not accepting it, ask organizers on chat or via e-mail <a href={"mailto: justcatthefish+2019@gmail.com"} title={""}>justcatthefish+2019@gmail.com</a>. <b>Do not brute-force flag validation endpoint.</b></li>
                <li>Attacking the infrastructure or any attempt to disrupt the competition is prohibited.</li>
                <li>Please, report any bugs you find in the infrastructure or tasks directly to the organizers.</li>
                <li><b>Breaking any of the above rules may result in team disqualification.</b></li>
                <li>We have a custom dynamic scoring system, which means that the challenge’s points depend on the number of its solves. We will embed the equation before the CTF starts.</li>
                <li>All flags fall into the following format: <code>{"justCTF{something_h3re!}"}</code>, unless the challenge description states otherwise.</li>
                <li>Challenges might be released at different times, but it is guaranteed that all of them will be released no later than 10 hours before the end of the competition.</li>
                <li>The live chat address will be announced on the CTF page.</li>
                <li>All crucial information about challenges or the competition will be announced in the news section on the CTF page and on the corresponding channel on the live chat.</li>
                <li>Registration will be open before and throughout the competition.</li>
                <li>The competition will last for 37 hours straight.</li>
                <li><b>During the last hour, the scoreboard will be frozen until the end (its changes won’t be available for players). However, points for tasks will be updated at all times.</b></li>
                <li>The presented set of rules might change before the start of the competition.</li>
                <li>In order to receive the prizes, winning teams may be asked to submit write-ups in 10 business days after the end of the competition.</li>
                <li>Resolving any unregulated cases remains on organizers' discretion.</li>
            </ol>

            <Footer />
        </div>
    </div>
);
