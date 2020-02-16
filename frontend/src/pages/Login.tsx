import * as React from "react";
import {inject, observer} from "mobx-react";
import {observable} from "mobx";
import {RouterStore} from "mobx-react-router";
import * as Recaptcha from "react-recaptcha";

import Footer from "@components/Footer";

import {IRootStore} from "@store/index";
import {recaptchaToken} from "@consts/index";

import {ErrorCodes, ILoginRequest, SetLogin} from "@libs/api";

import "@styles/login.scss";


@inject("store", "routing")
@observer
export class LoginPage extends React.Component<ILoginPageProps, {}> {
    private refEmailAddress = React.createRef<HTMLInputElement>();
    private refPassword = React.createRef<HTMLInputElement>();
    private refSubmit = React.createRef<HTMLButtonElement>();
    private recaptchaInstance: Recaptcha | null = null;

    @observable errorMessage: string = "";

    render( ) {
        return (
            <div className={"page login"}>
                <div className={"inner"}>
                    <h1 className={"mainTitle"}>Log in</h1>

                    {this.errorMessage && this.errorMessage.length && <div className={"errorMessage"}>{this.errorMessage}</div>}

                    <form onSubmit={this.formSubmit}>
                        <div className={"form-group"}>
                            <label htmlFor={"emailAddress"}>e-mail</label>
                            <input type={"text"} name={"email"} placeholder={"E-MAIL"} id={"emailAddress"} ref={this.refEmailAddress} />
                        </div>

                        <div className={"form-group"}>
                            <label htmlFor={"password"}>password</label>
                            <input type={"password"} name={"password"} placeholder={"PASSWORD"} id={"password"} ref={this.refPassword} />
                        </div>

                        <button className={"submitButton"} ref={this.refSubmit} type={"submit"}>log in</button>

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

                    {/*<a href={"/forgot"} title={"Reset password"} className={"reset"} onClick={this.onClick}>Reset password</a>*/}
                    <a href={"/register"} title={"Register"} className={"register"} onClick={this.onClick}>Don’t have an account? <span>Register now</span></a>

                    <Footer sticky={true} />
                </div>
            </div>
        )
    }

    private formSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        this.recaptchaInstance && this.recaptchaInstance.execute();
    };

    private onClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault();

        const href = e.currentTarget.attributes.getNamedItem("href");

        if( !!href && !!this.props.routing )
            this.props.routing.push(href.value);
    };

    private verifyCaptcha = (captchaToken: string) => {
        const form: ILoginRequest = {
            email: (this.refEmailAddress.current && this.refEmailAddress.current.value) || '',
            password: (this.refPassword.current && this.refPassword.current.value) || '',
            captcha: captchaToken,
        };

        this.refSubmit.current && this.refSubmit.current.setAttribute("disabled", "disabled");

        (async () => {
            let err = null;
            let data = null;
            try {
                const [data2, err2] = await SetLogin(form);
                if(err2) {
                    err = ErrorCodes.toHumanMessage(err2);
                }
                data = data2;
            } catch (e) {
                err = String(e);
            }
            if(err !== null || data == null) {
                this.errorMessage = String(err);

                return
            }
            this.props.store.ctf.setUserSession(data);
            this.props.routing.push('/challenges');
        })().finally(() => {
            this.refSubmit.current && this.refSubmit.current.removeAttribute("disabled");
        });
    };
}

interface ILoginPageProps {
    store: IRootStore,
    routing: RouterStore
}
