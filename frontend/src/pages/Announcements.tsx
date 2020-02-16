import * as React from "react";
import {inject, observer} from "mobx-react";

import Footer from "@components/Footer";
import Loader from "@components/Loader";
import AnnouncementElement from "@components/AnnouncementElement";

import {IRootStore} from "@store/index";

import "@styles/announcements.scss";

@inject("store")
@observer
export class AnnouncementsPage extends React.Component<IAnnouncementsPageProps, {}> {
    async componentDidMount() {
        await this.props.store.ctf.fetchAnnouncements();
        this.props.store.ctf.setSeenAnnouncements();
    }

    render( ) {
        return (
            <div className={"page announcements"}>
                <div className={"inner"}>
                    <h1 className={"mainTitle"}>News</h1>

                    {this.props.store.ctf.announcementsState === "pending" && <Loader text={"Loading news"} />}
                    {this.props.store.ctf.announcementsState === "error" && <Loader text={"Error during loading news"} />}
                    {this.props.store.ctf.announcementsState === "done" && (<div className={"list"}>
                        {this.props.store && Array.from(this.props.store.ctf.announcements.values()).map((row, index) => (
                            <AnnouncementElement key={row.id} info={row} index={index} />
                        ))}
                    </div>)}
                    <Footer sticky={true} />
                </div>

            </div>
        );
    }
}

interface IAnnouncementsPageProps {
    store: IRootStore
}