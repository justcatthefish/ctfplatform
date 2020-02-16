import http from "@libs/http";
import {baseUrl} from "@consts/index";

export enum ErrorCodes {
    invalid_team_name_ascii = "invalid_team_name_ascii",
    invalid_team_name_length = "invalid_team_name_length",
    invalid_json = "invalid_json",
    invalid_avatar = "invalid_avatar",
    invalid_email = "invalid_email",
    invalid_country = "invalid_country",
    invalid_website = "invalid_website",
    invalid_captcha = "invalid_captcha",
    invalid_flag = "invalid_flag",
    invalid_password_length = "invalid_password_length",
    invalid_current_password = "invalid_current_password",
    invalid_password_or_username = "invalid_password_or_username",
    internal_error = "internal_error",
    email_or_name_already_exists = "email_or_name_already_exists",
    not_authorize = "not_authorize",
    already_solved = "already_solved",

    undefined_error = "undefined_error",
}

export namespace ErrorCodes {
    export function toHumanMessage(code: ErrorCodes): string {
        const a: any = {
            [ErrorCodes.invalid_json]: "Invalid payload. I you get this error contact with admins!",
            [ErrorCodes.invalid_avatar]: "Avatar should have max. 200kb and max. 256px width or height.",
            [ErrorCodes.invalid_email]: "Email is invalid.",
            [ErrorCodes.invalid_country]: "Country code is invalid.",
            [ErrorCodes.invalid_website]: "URL must start with \"https://\"",
            [ErrorCodes.invalid_captcha]: "Captcha is invalid. Try again.",
            [ErrorCodes.invalid_flag]: "Invalid flag.",
            [ErrorCodes.invalid_password_length]: "Password should have min. 8 characters.",
            [ErrorCodes.invalid_current_password]: "Current password is invalid.",
            [ErrorCodes.invalid_password_or_username]: "Team not exists or invalid password",
            [ErrorCodes.internal_error]: "Internal error. I you get this error recently contact with admins!",
            [ErrorCodes.email_or_name_already_exists]: "Team name or email already exists.",
            [ErrorCodes.not_authorize]: "Not authorize. Please login :)",
            [ErrorCodes.already_solved]: "You already solved this challenge.",
            [ErrorCodes.invalid_team_name_ascii]: "Invalid team name. Should contains only ascii characters!",
            [ErrorCodes.invalid_team_name_length]: "Invalid team name. Should have at least 1 character!",
            [ErrorCodes.undefined_error]: "Unknown error. Try again.",
        };
        return a[code] || a[ErrorCodes.undefined_error];
    }
}

interface IScoreboardResponse {
    team: ITeamResponse & {email: undefined};
    points: number;
}

interface IAnnouncementResponse {
    id: number;
    title: string;
    description: string;
    created_at: string;
}

interface ITaskResponse {
    id: number;
    name: string;
    points: number;
    categories: Array<string>;
    difficult: string;
    description: string;
    solvers: number;
}

interface IInfoResponse {
    start: string;
    end: string;
    flags_count: number;
    teams_count: number;
    countries_count: number;
    tasks_unsolved_count: number;
}

export interface ITaskAuditResponse {
    id: number;
    name: string;
    created_at: string;
}

export interface ITeamResponse {
    id: number;
    name: string;
    email: string;
    avatar: string;
    country: string;
    affiliation: string;
    website: string;
    created_at: string;
    task_solved: Array<ITaskAuditResponse>;
}

export interface IRegisterRequest {
    name: string;
    email: string;
    password: string;
    country: string;
    avatar: File | null;
    captcha: string;
}

export interface ILoginRequest {
    email: string;
    password: string;
    captcha: string;
}

export interface ISettingsRequest {
    current_password: string;
    new_password: string;
    country: string;
    avatar: File | null;
    affiliation: string;
    website: string;
}

export interface IFlagRequest {
    flag: string;
}

interface IResizeImageOptions {
    maxSize: number;
    file: File;
}

export const resizeImage = (settings: IResizeImageOptions): Promise<string> => {
    const file = settings.file;
    const maxSize = settings.maxSize;
    const reader = new FileReader();
    const image = new Image();
    const canvas = document.createElement('canvas');

    const resize = (ok: any, no: any) => {
        let width = image.width;
        let height = image.height;

        if (width > height) {
            if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }
        }

        canvas.width = width;
        canvas.height = height;
        // @ts-ignore
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/png');
        let encoded = dataUrl.replace(/^data:(.*,)?/, '');
        if(atob(encoded).length > 200000) {
            no(new Error("Image is bigger then 200kb"));
            return;
        }
        ok(encoded);
    };

    return new Promise((ok, no) => {
        if (!file.type.match(/image.*/)) {
            no(new Error("Not an image"));
            return;
        }

        reader.readAsDataURL(file);
        reader.onload = (readerEvent: any) => {
            image.onload = () => resize(ok, no);
            image.src = readerEvent.target.result;
            image.onerror = error => {
                console.error('error', error);
                no(new Error("Image is malformed"));
            };
        };
        reader.onerror = error => {
            console.error('error', error);
            no(new Error("Image is malformed"));
        };
    })
};

export async function GetTasks(): Promise<[ITaskResponse[], ErrorCodes | null]> {
    const resp = await http.get({
        url: baseUrl + "/tasks",
    });
    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [[], out];
    }
    const json = await resp.json();
    return [json, null];
}

export async function GetScoreboard(): Promise<[IScoreboardResponse[], boolean, ErrorCodes | null]> {
    const resp = await http.get({
        url: baseUrl + "/scoreboard",
    });
    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [[], false, out];
    }
    const isFreeze = resp.headers.get("X-Freeze") === "1";
    const json = await resp.json();
    return [json, isFreeze, null];
}

export async function GetAnnouncements(): Promise<[IAnnouncementResponse[], ErrorCodes | null]> {
    const resp = await http.get({
        url: baseUrl + "/announcements",
    });
    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [[], out];
    }
    const json = await resp.json();
    return [json, null];
}

export async function GetTeams(): Promise<[ITeamResponse[], ErrorCodes | null]> {
    const resp = await http.get({
        url: baseUrl + "/teams",
    });
    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [[], out];
    }
    const json = await resp.json();
    return [json, null];
}

export async function GetInfo(): Promise<[IInfoResponse | null, ErrorCodes | null]> {
    const resp = await http.get({
        url: baseUrl + "/info",
    });
    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [null, out];
    }
    const json = await resp.json();
    return [json, null];
}

export async function GetCurrentTeam(): Promise<[ITeamResponse | null, ErrorCodes | null]> {
    const resp = await http.get({
        url: baseUrl + "/team",
    });
    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [null, out];
    }
    const json = await resp.json();
    return [json, null];
}

export async function GetTeam(teamId: number): Promise<[ITeamResponse | null, ErrorCodes | null]> {
    const resp = await http.get({
        url: baseUrl + "/team_info/" + teamId.toString(),
    });
    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [null, out];
    }
    const json = await resp.json();
    return [json, null];
}

export async function GetTaskSolvers(taskId: number): Promise<[ITaskAuditResponse[], ErrorCodes | null]> {
    const resp = await http.get({
        url: baseUrl + "/task_solvers/" + taskId.toString(),
    });
    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [[], out];
    }
    const json = await resp.json();
    return [json, null];
}

export async function SetRegister(input: IRegisterRequest): Promise<ErrorCodes | null> {
    if(input.avatar === null) {
        // @ts-ignore
        input.avatar = '';
    } else {
        // @ts-ignore
        input.avatar = await resizeImage({
            file: input.avatar,
            maxSize: 256,
        });
    }

    const resp = await http.post({
        url: baseUrl + "/team/register",
        data: input,
    });

    if (resp.status !== 201) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return out;
    }
    return null;
}

export async function SetSettings(input: ISettingsRequest): Promise<ErrorCodes | null> {
    if(input.avatar === null) {
        // @ts-ignore
        input.avatar = '';
    } else {
        // @ts-ignore
        input.avatar = await resizeImage({
            file: input.avatar,
            maxSize: 256,
        });
    }

    const resp = await http.post({
        url: baseUrl + "/team/settings",
        data: input,
    });

    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return out;
    }
    return null;
}

export async function SetLogin(input: ILoginRequest): Promise<[ITeamResponse | null, ErrorCodes | null]> {
    const resp = await http.post({
        url: baseUrl + "/team/login",
        data: input,
    });

    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return [null, out];
    }
    const json = await resp.json();
    return [json, null];
}

export async function SetLogout(): Promise<ErrorCodes | null> {
    const resp = await http.post({
        url: baseUrl + "/team/logout",
        data: {},
    });

    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return out;
    }
    return null;
}

export async function SetFlag(input: IFlagRequest): Promise<ErrorCodes | null> {
    const resp = await http.post({
        url: baseUrl + "/flag/submit",
        data: input,
    });

    if (resp.status !== 200) {
        let out = (await resp.text()) as ErrorCodes;
        if(!Object.values(ErrorCodes).includes(out)) {
            out = ErrorCodes.undefined_error;
        }
        return out;
    }
    return null;
}
