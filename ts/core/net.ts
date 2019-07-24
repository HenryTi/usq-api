import fetch from "node-fetch";
import { Runner } from "./runner";
import { getDb, isDevelopment, Db, getUnitxDb } from "./db";
import { OpenApi } from "./openApi";
import { urlSetUqHost } from "./setHostUrl";
import { centerApi } from "./centerApi";
import { Message } from "./model";
import { UnitxApi } from "./unitxApi";

export abstract class Net {
    private runners: {[name:string]: Runner} = {};

    async getRunner(name:string):Promise<Runner> {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {
            let dbName = this.getDbName(name);
            let db = getDb(dbName);
            runner = await this.createRunnerFromDb(name, db);
            if (runner === undefined) return;
            /*
            let isExists = await db.exists();
            if (isExists === false) {
                this.runners[name] = null;
                return;
            }
            runner = new Runner(db);
            this.runners[name] = runner;
            */
        }
        await runner.init();
        return runner;
    }

    async getUnitxRunner():Promise<Runner> {
        let name = '$unitx';
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {            
            let db = this.getUnitxDb();
            runner = await this.createRunnerFromDb(name, db);
            if (runner === undefined) return;
            /*
            let isExists = await db.exists();
            if (isExists === false) {
                this.runners[name] = null;
                return;
            }
            runner = new Runner(db);
            this.runners[name] = runner;
            */
        }
        await runner.init();
        return runner;
    }

    private async createRunnerFromDb(name:string, db:Db):Promise<Runner> {
        let isExists = await db.exists();
        if (isExists === false) {
            this.runners[name] = null;
            return;
        }
        let runner = new Runner(db);
        this.runners[name] = runner;
        return runner;
    }

    abstract getDbName(name:string):string;
    protected abstract getUnitxDb(): Db;

    private uqOpenApis: {[uqFullName:string]: {[unit:number]:OpenApi}} = {};
    async getOpenApi(uqFullName:string, unit:number):Promise<OpenApi> {
        let openApis = this.uqOpenApis[uqFullName];
        if (openApis === null) return null;
        if (openApis !== undefined) {
            let ret = openApis[unit];
            if (ret === null) return null;
            if (ret !== undefined) return ret;
        }
        else {
            this.uqOpenApis[uqFullName] = openApis = {};
        }        
        let uqUrl = await centerApi.urlFromUq(unit, uqFullName);
        if (uqUrl === undefined) return openApis[unit] = null;
        let url = await this.getUqUrl(uqUrl);
        return openApis[unit] = new OpenApi(url);
    }

    private unitxApis: {[unit:number]:UnitxApi} = {};
    async getUnitxApi(unit:number):Promise<UnitxApi> {
        let unitxApi = this.unitxApis[unit];
        if (unitxApi === null) return null;
        if (unitxApi !== undefined) return unitxApi;
        let unitx = await centerApi.unitx(unit);
        if (unitx === undefined) return this.unitxApis[unit] = null;
        let url = await this.getUnitxUrl(unitx);
        return this.unitxApis[unit] = new UnitxApi(url);
    }

    async sendToUnitx(unit:number, msg:Message):Promise<number[]> {
        let unitxApi = await this.getUnitxApi(unit);
        if (unitxApi === null) {
            console.log('unit %s not have unitx', unit);
            return;
        }
        let toArr:number[] = await unitxApi.send(msg);
        return toArr;
    }

    async uqUrl(unit:number, uq:number):Promise<string> {
        let uqUrl = await centerApi.uqUrl(unit, uq);
        return await this.getUqUrl(uqUrl);
    }

    private async getUqUrl(urls: {db:string, url:string;}):Promise<string> {
        let {db, url} = urls;
        if (isDevelopment === true) {
            let urlDebug = await this.getUrlDebug();
            if (urlDebug !== undefined) url = urlDebug;
        }
        return this.getUrl(db, url);
    }

    protected abstract getUrl(db:string, url:string):string;

    private async getUrlDebug():Promise<string> {
        try {
            let urlDebug = urlSetUqHost();
            //urlDebug = urlSetUnitxHost(urlDebug);
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            return urlDebug;
        }
        catch (err) {
        }
    }

    private async getUnitxUrl(urls: {db:string, url:string;}):Promise<string> {
        let {db, url} = urls;
        if (isDevelopment === true) {
            let urlDebug = await this.getUrlDebug();
            if (urlDebug !== undefined) url = urlDebug;
        }
        return this.unitxUrl(url);
    }
    protected abstract unitxUrl(url:string):string;
}

class ProdNet extends Net {
    getDbName(name:string):string {return name}
    protected getUnitxDb(): Db {return getUnitxDb(false)}
    protected getUrl(db:string, url:string):string {
        return url + 'uq/prod/' + db + '/';
    }
    protected unitxUrl(url:string):string {return url + 'uq/unitx-prod/'};
}

class TestNet extends Net {
    getDbName(name:string):string {return name + '$test'}
    protected getUnitxDb(): Db {return getUnitxDb(true)}
    protected getUrl(db:string, url:string):string {
        return url + 'uq/test/' + db + '/';
    }
    protected unitxUrl(url:string):string {return url + 'uq/unitx-test/'};
}

export const prodNet = new ProdNet;
export const testNet = new TestNet;