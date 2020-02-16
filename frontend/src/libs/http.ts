interface IHttpParams {
    url: string;
    method?: string;
    headers?: { [key: string]: string };
    params?: { [key: string]: string | number };
    data?: { [key: string]: any };
}

function getQueryString(params: any) {
    return Object.keys(params)
        .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
        .join("&");
}

function getCookie(name: string): string {
    let cookieValue = "";
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            if (cookie.substring(0, name.length + 1) === (name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function request(params: IHttpParams) {
    const method = params.method || "GET";
    const headers = params.headers || {
        "Accept": "application/json",
        "Content-Type": "application/json",
    };

    const qs = Object.keys(params.params || {}).length > 0 ? ("?" + getQueryString(params.params)) : "";
    const body = typeof params.data === "object" ? JSON.stringify(params.data) : undefined;

    return fetch(params.url + qs, { method, headers, body });
}

export default {
    getCookie: getCookie,
    delete: async (params: IHttpParams): Promise<Response> => request(Object.assign({ method: "DELETE" }, params)),
    get: async (params: IHttpParams): Promise<Response> => request(Object.assign({ method: "GET" }, params)),
    post: async (params: IHttpParams): Promise<Response> => request(Object.assign({ method: "POST" }, params)),
    put: async (params: IHttpParams): Promise<Response> => request(Object.assign({ method: "PUT" }, params)),
};
