import { Router } from 'express';
import { Runner, RouterBuilder, setUqBuildSecret } from '../../core';

export function buildBuildRouter(router:Router, rb: RouterBuilder) {
    rb.post(router, '/start',
    async (runner:Runner, body:{enc:string}):Promise<void> => {
        let {enc} = body;
        setUqBuildSecret(enc);
    });

    rb.post(router, '/finish',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        let {uqId} = runner;
        let {uqId:paramUqId} = body;
        if (!uqId) {
            await runner.setSetting(0, 'uqId', String(paramUqId));
            uqId = paramUqId;
        }
        await runner.initSetting();

        if (uqId !== Number(paramUqId)) {
            debugger;
            throw 'error uqId';
        }
        runner.reset();
    });

    rb.post(router, '/sql',
    async (runner:Runner, body:{sql:string, params:any[]}): Promise<any> => {
        //return this.db.sql(sql, params);
        let {sql, params} = body;
        return await runner.sql(sql, params);
    });

    rb.post(router, '/create-database',
    async (runner:Runner, body:any): Promise<void> => {
        await runner.createDatabase();
    });

    rb.post(router, '/exists-databse',
    async (runner:Runner): Promise<boolean> => {
        return await runner.existsDatabase();
    });

    rb.post(router, '/set-setting',
    async (runner:Runner, body: {[name:string]: any}): Promise<void> => {
        let promises:Promise<any>[] = [];
        for (let i in body) {
            promises.push(runner.setSetting(0, i, body[i]));
        }
        await Promise.all(promises);
    });

    rb.get(router, '/setting',
    async (runner:Runner, body: {name:string}):Promise<string> => {
        //let ret = await this.unitTableFromProc('tv_$get_setting', unit, [name]);
        let ret = await runner.getSetting(0, body.name);
        if (ret.length===0) return undefined;
        return ret[0].value;
    });

    rb.get(router, '/entitys',
    async (runner:Runner, body:{hasSource:string}): Promise<any[][]> => {
        //return await this.db.call('tv_$entitys', [hasSource===true? 1:0]);
        return await runner.loadSchemas(Number(body.hasSource));
    });

    rb.post(router, '/entity',
    async (runner:Runner, body:any):Promise<any> => {
        //let params = [user, id, name, type, schema, run, source, from, open];
        let {id, name, type, schema, run, source, from, open} = body;
        //unit:number, user:number, */id:number, name:string, type:number, schema:string, run:string, source:string, from:string, open:number
        return await runner.saveSchema(0, 0, id, name, type, schema, run, source, from, open);
    });

    rb.get(router, '/const-strs',
    async (runner:Runner, body:any): Promise<{[name:string]:number}[]> => {
        return await runner.loadConstStrs();
    });

    rb.get(router, '/const-str',
    async (runner:Runner, body:{type:string}): Promise<number> => {
        return await runner.saveConstStr(body.type);
    });

    rb.get(router, '/entity-version',
    async (runner:Runner, body: {name:string; version:string}): Promise<string> => {
        let {name, version} = body;
        return await runner.loadSchemaVersion(name, version);
    });

    rb.post(router, '/entity-validate',
    async (runner:Runner, body: {entities:string}):Promise<any[]> => {
        return await runner.setEntityValid(body.entities);
    });

    /*
    rb.post(router, '/save-face',
    async (runner:Runner, body:{bus:string, busOwner:string, busName:string, faceName:string}) => {
        let {bus, busOwner, busName, faceName} = body;
        await runner.saveFace(bus, busOwner, busName, faceName);
    });
    */
};