import * as React from "react";

import {IAnnouncement} from "@store/CtfStore";
import {formatDate} from "@libs/date";
import ReactMarkdown from "react-markdown";

const AnnouncementElement: React.FunctionComponent<IAnnouncementElementProps> = ( { info }) => {
    return (
        <div className={"announcement"}>
            <header>
                <h2>{info.api.title}</h2>
                {info.isNew() && <span className={"label"}>New</span>}
                <div className={"date"}>
                    {formatDate(info.api.created_at)}
                </div>
            </header>

            {/*<p>{info.api.description}</p>*/}
            <div className={"description"}>
                <ReactMarkdown source={info.api.description} escapeHtml={true} />
            </div>
        </div>
    );
};

interface IAnnouncementElementProps {
    info: IAnnouncement;
    index: number;
}

export default AnnouncementElement;