import * as React from "react";
import {inject, observer} from "mobx-react";
import {observable} from "mobx";

import Footer from "@components/Footer";

import {IRootStore} from "@store/index";
import {Countries} from "@consts/country";

import {ErrorCodes, ISettingsRequest, resizeImage, SetSettings} from "@libs/api";

import defaultAvatar from "../assets/images/avatar_default_big.png";

import "@styles/settings.scss";

@inject("store")
@observer
export class SettingsPage extends React.Component<ISettingsPageProps, {}> {
    private refFile = React.createRef<HTMLInputElement>();
    private refTeamName = React.createRef<HTMLInputElement>();
    private refEmailAddress = React.createRef<HTMLInputElement>();
    // private refCurrentPassword = React.createRef<HTMLInputElement>();
    // private refNewPassword = React.createRef<HTMLInputElement>();
    private refCountry = React.createRef<HTMLSelectElement>();
    private refAffiliation = React.createRef<HTMLInputElement>();
    private refWebsite = React.createRef<HTMLInputElement>();
    private refSubmit = React.createRef<HTMLButtonElement>();

    @observable errorMessage: string = "";
    @observable successMessage: string = "";
    @observable avatarData: string = "";

    async componentDidMount() {
        await this.props.store.ctf.fetchMyTeam();
    }

    render( ) {
        if(!this.props.store.ctf.myTeam)
           return null;

        return (
            <div className={"page settings"}>
                <div className={"inner"}>
                    <h1 className={"mainTitle"}>Profile</h1>

                    {this.errorMessage && this.errorMessage.length && <div className={"errorMessage"}>{this.errorMessage}</div>}
                    {this.successMessage && this.successMessage.length && <div className={"successMessage"}>{this.successMessage}</div>}

                    <form onSubmit={this.formSubmit}>
                        <div className={"form-group avatar"}>
                            <label htmlFor={"customAvatar"}>avatar</label>

                            <div className={"customFile"} id={"customAvatar"}>
                                <input onChange={this.onChangeAvatar} type={"file"} name={"avatar"} id={"file"} ref={this.refFile} accept={"image/*"} />
                                <label htmlFor={"file"}>
                                    <img alt={"avatar"} src={this.avatarData ||this.props.store.ctf.myTeam.api.avatar || defaultAvatar} />
                                </label>
                            </div>
                        </div>

                        <div className={"form-group"}>
                            <label htmlFor={"teamName"}>team name</label>
                            <input disabled={true} type={"text"} name={"teamName"} placeholder={"TEAM NAME"} id={"teamName"} ref={this.refTeamName} defaultValue={this.props.store.ctf.myTeam.api.name} />
                        </div>

                        <div className={"form-group"}>
                            <label htmlFor={"emailAddress"}>e-mail</label>
                            <input disabled={true} type={"text"} name={"email"} placeholder={"E-MAIL"} id={"emailAddress"} ref={this.refEmailAddress} defaultValue={this.props.store.ctf.myTeam.api.email}  />
                        </div>

                        {/*<div className={"form-group"}>*/}
                        {/*    <label htmlFor={"currentPassword"}>current password</label>*/}
                        {/*    <input type={"password"} name={"currentPassword"} placeholder={"CURRENT PASSWORD"} id={"currentPassword"} ref={this.refCurrentPassword} />*/}
                        {/*</div>*/}

                        {/*<div className={"form-group"}>*/}
                        {/*    <label htmlFor={"newPassword"}>new password</label>*/}
                        {/*    <input type={"password"} name={"newPassword"} placeholder={"NEW PASSWORD"} id={"newPassword"} ref={this.refNewPassword} />*/}
                        {/*</div>*/}

                        <div className={"form-group"}>
                            <label htmlFor={"country"}>country</label>
                            <select ref={this.refCountry} defaultValue={this.props.store.ctf.myTeam ? this.props.store.ctf.myTeam.api.country : ""}>
                                {Object.entries(Countries).map(([isoCode, countryName]) => (
                                    <option key={isoCode} value={isoCode}>{countryName}</option>
                                ))}
                            </select>
                        </div>

                        <div className={"form-group"}>
                            <label htmlFor={"affiliation"}>affiliation</label>
                            <input type={"text"} name={"affiliation"} placeholder={"AFFILIATION"} id={"affiliation"} ref={this.refAffiliation} defaultValue={this.props.store.ctf.myTeam.api.affiliation} />
                        </div>

                        <div className={"form-group"}>
                            <label htmlFor={"web"}>Website/Twitter</label>
                            <input type={"text"} name={"web"} placeholder={"Website/Twitter"} id={"web"} ref={this.refWebsite} defaultValue={this.props.store.ctf.myTeam.api.website} />
                        </div>

                        <button className={"submitButton"} ref={this.refSubmit} type={"submit"}>save changes</button>
                    </form>

                    <Footer />
                </div>
            </div>
        )
    }

    private formSubmit = ( e: React.FormEvent<HTMLFormElement> ) => {
        e.preventDefault();

        const form: ISettingsRequest = {
            // current_password: (this.refCurrentPassword.current && this.refCurrentPassword.current.value) || '',
            // new_password: (this.refNewPassword.current && this.refNewPassword.current.value) || '',
            current_password: '',
            new_password: '',
            country: (this.refCountry.current && this.refCountry.current.value) || '',
            affiliation: (this.refAffiliation.current && this.refAffiliation.current.value) || '',
            website: (this.refWebsite.current && this.refWebsite.current.value) || '',
            avatar: (this.refFile.current && this.refFile.current.files && this.refFile.current.files[0]) || null,
        };
        this.refSubmit.current && this.refSubmit.current.setAttribute("disabled", "disabled");

        (async () => {
            let err = null;
            try {
                const err2 = await SetSettings(form);
                if(err2) {
                    err = ErrorCodes.toHumanMessage(err2);
                }
            } catch (e) {
                err = String(e);
            }
            if(err !== null) {
                this.errorMessage = String(err);
                this.successMessage = "";

                return;
            }

            this.errorMessage = "";
            this.successMessage = "Settings updated!";

            if(this.refFile.current) this.refFile.current.value = "";
        })().finally(() => {
            this.refSubmit.current && this.refSubmit.current.removeAttribute("disabled");
        });
    };

    private onChangeAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = (event.target.files && event.target.files[0]) || null;
        if(!file) {
            return;
        }
        resizeImage({
            maxSize: 256,
            file: file,
        }).then((data: string) => {
            this.avatarData = 'data:image/png;base64,' + data;
        }).catch((e: Error) => {
            this.successMessage = '';
            this.errorMessage = String(e);

            event.target.value = "";
        });
    };
}

interface ISettingsPageProps {
    store: IRootStore;
}