import fetch, {Headers} from 'node-fetch';

export abstract class Fetch {
    private baseUrl:string;
    constructor(baseUrl:string) {
        this.baseUrl = baseUrl;
    }
    protected async get(url: string, params: any = undefined): Promise<any> {
        if (params) {
            let keys = Object.keys(params);
            if (keys.length > 0) {
                let c = '?';
                for (let k of keys) {
                    let v = params[k];
                    if (v === undefined) continue;
                    url += c + k + '=' + params[k];
                    c = '&';
                }
            }
        }
        return await this.innerFetch(url, 'GET');
    }

    protected async post(url: string, params: any): Promise<any> {
        return await this.innerFetch(url, 'POST', params);
    }

    private async innerFetch(url: string, method:string, body?:any): Promise<any> {
        var headers = new Headers();
        headers.append('Accept', 'application/json'); // This one is enough for GET requests
        headers.append('Content-Type', 'application/json'); // This one sends body
        let res = await fetch(
            this.baseUrl + url, 
            {
                headers: {
                    "Content-Type": 'application/json',
                    "Accept": 'application/json',
                    //"Authorization": 'this.apiToken',
                    //"Access-Control-Allow-Origin": '*'
                },
                method: method,
                body: JSON.stringify(body),
            }
        );
        if (res.status !== 200) {
            throw {
                error: res.statusText,
                code: res.status,
            };
            //console.log('statusCode=', response.statusCode);
            //console.log('statusMessage=', response.statusMessage);
        }
        let json = await res.json();
        if (json.ok !== true) {
            throw json.error;
        }
        return json.res;
    }
}
