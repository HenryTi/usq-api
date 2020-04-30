import { Router, Request, Response } from 'express';
import { EntityRunner, RouterBuilder, setUqBuildSecret, Db, prodNet, testNet } from '../../core';
import { BuildRunner } from '../../core';

export function buildBuildRouter(router:Router, rb: RouterBuilder) {
    router.post('/start', async (req:Request, res:Response) => {
        try {
            let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
			await prodNet.runnerCompiling(db);
			await testNet.runnerCompiling(db);
			let {enc} = req.body;
			setUqBuildSecret(enc);
			let runner = new BuildRunner(db);
			let exists = await runner.buildDatabase();
			//await runner.initProcObjs();
            res.json({
                ok: true,
                res: exists
            });
        }
        catch (err) {
            res.json({error: err});
        }
    });
    router.post('/build-database', async (req:Request, res:Response) => {
        try {
            let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
            let runner = new BuildRunner(db);
            let exists = await runner.buildDatabase();
            res.json({
                ok: true,
                res: {
                    exists: exists,
                }
            });
        }
        catch (err) {
            res.json({error: err});
        }
    });

    //rb.post(router, '/finish',
    //async (runner:EntityRunner, body:any, params:any):Promise<any> => {
	router.post('/finish', async (req:Request, res:Response) => {
        try {
			let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
			let runner = new BuildRunner(db);
			//let {uqId} = runner;
			let {uqId:paramUqId, uqVersion} = req.body;
			//if (!uqId) {
			await Promise.all([
				runner.setSetting(0, 'uqId', String(paramUqId)),
				runner.setSetting(0, 'uqVersion', String(uqVersion))
			]);
				//uqId = paramUqId;
			//}
			await runner.initSetting();

			//if (String(uqId) !== String(paramUqId)) {
			//    debugger;
			//    throw 'error uqId';
			//}
			//await runner.reset();
			//async reset() {
			await prodNet.resetRunnerAfterCompile(db);
			await testNet.resetRunnerAfterCompile(db);
			//await this.net.resetRunnerAfterCompile(this);
			//}
            res.json({
                ok: true,
            });
		}
		catch (err) {
			res.json({error: err});
		}
	});

    router.post('/sql', async (req:Request, res:Response) => {
        try {
            let dbName:string = req.params.db;
            let db = Db.db(rb.getDbName(dbName));
            let runner = new BuildRunner(db);
			let {sql, params} = req.body;
			let result = await runner.sql(sql, params);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({error: err});
        }
    });
/*
	rb.post(router, '/sql',
	    async (runner:EntityRunner, body:{sql:string, params:any[]}): Promise<any> => {
        //return this.db.sql(sql, params);
        let {sql, params} = body;
        return await runner.sql(sql, params);
    });
*/

	router.post('/proc-sql', async (req:Request, res:Response) => {
		try {
			let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
			let runner = new BuildRunner(db);
			let {name, proc} = req.body;
			let result = await runner.procSql(name, proc);
            res.json({
                ok: true,
                res: result
            });
		}
		catch (err) {
			res.json({error: err});
		}
	});
/*
	rb.post(router, '/proc-sql',
    async (runner:EntityRunner, body:{name:string, proc:string}): Promise<any> => {
        //return this.db.sql(sql, params);
        let {name, proc} = body;
        return await runner.procSql(name, proc);
    });
*/
	router.post('/proc-core-sql', async (req:Request, res:Response) => {
		try {
			let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
			let runner = new BuildRunner(db);
			let {name, proc} = req.body;
			let result = await runner.procCoreSql(name, proc);
            res.json({
                ok: true,
                res: result
            });
		}
		catch (err) {
			res.json({error: err});
		}
	});
	/*
	rb.post(router, '/proc-core-sql',
    async (runner:EntityRunner, body:{name:string, proc:string}): Promise<any> => {
        let {name, proc} = body;
        return await runner.procCoreSql(name, proc);
    });
	*/
	router.post('/create-database', async (req:Request, res:Response) => {
		try {
			let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
			let runner = new BuildRunner(db);
			let result = await runner.createDatabase();
            res.json({
                ok: true,
                res: result
            });
		}
		catch (err) {
			res.json({error: err});
		}
	});
	/*
    rb.post(router, '/create-database',
    async (runner:EntityRunner, body:any): Promise<void> => {
        await runner.createDatabase();
    });
	*/
	router.post('/exists-database', async (req:Request, res:Response) => {
		try {
			let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
			let runner = new BuildRunner(db);
			let result = await runner.existsDatabase();
            res.json({
                ok: true,
                res: result
            });
		}
		catch (err) {
			res.json({error: err});
		}
	});
	/*
    rb.post(router, '/exists-databse',
    async (runner:EntityRunner): Promise<boolean> => {
        return await runner.existsDatabase();
    });
	*/
	
    //rb.post(router, '/set-setting',
    //async (runner:EntityRunner, body: {[name:string]: any}): Promise<void> => {
	router.post('/set-setting', async (req:Request, res:Response) => {
		try {
			let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
			let runner = new BuildRunner(db);
			let promises:Promise<any>[] = [];
			let {body} = req;
			for (let i in body) {
				promises.push(runner.setSetting(0, i, body[i]));
			}
			await Promise.all(promises);
            res.json({
                ok: true,
            });
		}
		catch (err) {
			res.json({error: err});
		}
	});

    //rb.get(router, '/setting',
    //async (runner:EntityRunner, body: {name:string}):Promise<string> => {
	router.get('/setting', async (req:Request, res:Response) => {
		try {
			let dbName:string = req.params.db;
			let db = Db.db(rb.getDbName(dbName));
			let runner = new BuildRunner(db);
			let ret = await runner.getSetting(0, req.body.name);
			if (ret.length===0) return undefined;
            res.json({
				ok: true,
				result: ret[0].value
            });
		}
		catch (err) {
			res.json({error: err});
		}
	});

    rb.get(router, '/entitys',
    async (runner:EntityRunner, body:{hasSource:string}): Promise<any[][]> => {
        //return await this.db.call('tv_$entitys', [hasSource===true? 1:0]);
        return await runner.loadSchemas(Number(body.hasSource));
    });

    rb.post(router, '/entity',
    async (runner:EntityRunner, body:any):Promise<any> => {
        //let params = [user, id, name, type, schema, run, source, from, open];
        let {id, name, type, schema, run, source, from, open} = body;
        //unit:number, user:number, */id:number, name:string, type:number, schema:string, run:string, source:string, from:string, open:number
        return await runner.saveSchema(0, 0, id, name, type, schema, run, source, from, open);
    });

    rb.get(router, '/const-strs',
    async (runner:EntityRunner, body:any): Promise<{[name:string]:number}[]> => {
        return await runner.loadConstStrs();
    });

    rb.get(router, '/const-str',
    async (runner:EntityRunner, body:{type:string}): Promise<number> => {
        return await runner.saveConstStr(body.type);
    });

    rb.get(router, '/entity-version',
    async (runner:EntityRunner, body: {name:string; version:string}): Promise<string> => {
        let {name, version} = body;
        return await runner.loadSchemaVersion(name, version);
    });

    rb.post(router, '/entity-validate',
    async (runner:EntityRunner, body: {entities:string, valid:number}):Promise<any[]> => {
        let {entities, valid} = body;
        return await runner.setEntityValid(entities, valid);
	});
	
	rb.post(router, '/tag-type', 
    async (runner:EntityRunner, body: {names:string}):Promise<void> => {
        let {names} = body;
        await runner.tagType(names);
	});

	rb.post(router, '/tag-save-sys', 
    async (runner:EntityRunner, body: {data:string}):Promise<void> => {
        let {data} = body;
        await runner.tagSaveSys(data);
	});
};
