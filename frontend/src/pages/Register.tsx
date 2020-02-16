import * as React from "react";
import {inject, observer} from "mobx-react";
import {observable} from "mobx";
import {RouterStore} from "mobx-react-router";
import * as Recaptcha from "react-recaptcha";

import Footer from "@components/Footer";

import {IRootStore} from "@store/index";
import {Countries} from "@consts/country";
import {recaptchaToken} from "@consts/index";

import {ErrorCodes, IRegisterRequest, SetRegister} from "@libs/api";

@inject("store", "routing")
@observer
export class RegisterPage extends React.Component<IRegisterPageProps, {}> {
    // private refFile = React.createRef<HTMLInputElement>();
    private refTeamName = React.createRef<HTMLInputElement>();
    private refEmailAddress = React.createRef<HTMLInputElement>();
    private refPassword = React.createRef<HTMLInputElement>();
    private refCountry = React.createRef<HTMLSelectElement>();
    private refSubmit = React.createRef<HTMLButtonElement>();
    private recaptchaInstance: Recaptcha | null = null;

    @observable errorMessage: string = "";
    @observable successMessage: string = "";

    render( ) {
        return (
            <div className={"page register"}>
                <div className={"inner"}>
                    <h1 className={"mainTitle"}>Register</h1>

                    {this.errorMessage && this.errorMessage.length && <div className={"errorMessage"}>{this.errorMessage}</div>}
                    {this.successMessage && this.successMessage.length && <div className={"successMessage"}>{this.successMessage}</div>}

                    <form onSubmit={this.formSubmit}>
                        {/*<div className={"form-group"}>*/}
                        {/*    <label htmlFor={"customAvatar"}>avatar</label>*/}
                        {/*    <div className={"customFile"} id={"customAvatar"}>*/}
                        {/*        <input type={"file"} name={"avatar"} id={"file"} ref={this.refFile} accept={"image/*"} />*/}
                        {/*        <label htmlFor={"file"}>*/}
                        {/*            <span className={"button"}>upload photo</span>*/}
                        {/*            <span>max. 256x256 px, 100 kb</span>*/}
                        {/*        </label>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        <div className={"form-group"}>
                            <label htmlFor={"teamName"}>team name</label>
                            <input type={"text"} name={"teamName"} placeholder={"TEAM NAME"} id={"teamName"} ref={this.refTeamName} />
                        </div>

                        <div className={"form-group"}>
                            <label htmlFor={"emailAddress"}>e-mail</label>
                            <input type={"email"} name={"email"} placeholder={"E-MAIL"} id={"emailAddress"} ref={this.refEmailAddress} />
                        </div>

                        <div className={"form-group"}>
                            <label htmlFor={"password"}>password</label>
                            <input type={"password"} name={"password"} placeholder={"PASSWORD"} id={"password"} ref={this.refPassword} />
                        </div>

                        <div className={"form-group"}>
                            <label htmlFor={"country"}>country</label>
                            <select ref={this.refCountry}>
                                {Object.entries(Countries).map(([isoCode, countryName]) => (
                                    <option key={isoCode} value={isoCode}>{countryName}</option>
                                ))}
                            </select>
                        </div>

                        <button className={"submitButton"} ref={this.refSubmit} type={"submit"}>register</button>

                        <Recaptcha
                            ref={e => this.recaptchaInstance = e}
                            sitekey={recaptchaToken}
                            size="invisible"
                            render={"explicit"}
                            onloadCallback={() => null}
                            verifyCallback={this.verifyCaptcha}
                            theme={"dark"}
                        />
                    </form>

                    <Footer sticky={true} />
                </div>
            </div>
        )
    }

    private formSubmit = ( e: React.FormEvent<HTMLFormElement> ) => {
        e.preventDefault();

        this.recaptchaInstance && this.recaptchaInstance.execute();
    };

    private verifyCaptcha = (captchaToken: string) => {
        const form: IRegisterRequest = {
            name: (this.refTeamName.current && this.refTeamName.current.value) || '',
            email: (this.refEmailAddress.current && this.refEmailAddress.current.value) || '',
            password: (this.refPassword.current && this.refPassword.current.value) || '',
            country: (this.refCountry.current && this.refCountry.current.value) || '',
            // avatar: (this.refFile.current && this.refFile.current.files && this.refFile.current.files[0]) || null,
            avatar: null,
            captcha: captchaToken,
        };

        this.refSubmit.current && this.refSubmit.current.setAttribute("disabled", "disabled");
        (async () => {
            let err = null;
            try {
                const err2 = await SetRegister(form);
                if(err2) {
                    err = ErrorCodes.toHumanMessage(err2);
                }
            } catch (e) {
                err = String(e);
            }
            if(err !== null) {
                this.errorMessage = String(err);
                this.successMessage = "";

                return
            }

            this.errorMessage = "";
            this.successMessage = "Now please login ;)";

            if(this.refTeamName.current) this.refTeamName.current.value = "";
            if(this.refEmailAddress.current) this.refEmailAddress.current.value = "";
            if(this.refPassword.current) this.refPassword.current.value = "";
            if(this.refCountry.current) this.refCountry.current.value = "";
            // if(this.refFile.current) this.refFile.current.value = "";

        })().finally(() => {
            this.refSubmit.current && this.refSubmit.current.removeAttribute("disabled");
        });

    };
}

interface IRegisterPageProps {
    store: IRootStore,
    routing: RouterStore
}
