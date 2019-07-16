"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const consts_1 = require("./consts");
const net_1 = require("./net");
const apiErrors = {
    databaseNotExists: -1,
};
;
class RouterBuilder {
    constructor(net) {
        this.process = (req, res, processer, queryOrBody, params) => __awaiter(this, void 0, void 0, function* () {
            try {
                let db = req.params.db;
                let runner = yield this.checkRunner(db, res);
                if (runner === undefined)
                    return;
                //let body = (req as any).body;
                let result = yield processer(runner, queryOrBody, params);
                res.json({
                    ok: true,
                    res: result
                });
            }
            catch (err) {
                res.json({ error: err });
            }
        });
        this.entityProcess = (req, res, entityType, processer, isGet) => __awaiter(this, void 0, void 0, function* () {
            try {
                let userToken = req.user;
                let { db, id: userId, unit } = userToken;
                if (db === undefined)
                    db = consts_1.consts.$unitx;
                let runner = yield this.checkRunner(db, res);
                if (runner === undefined)
                    return;
                let { params } = req;
                let { name } = params;
                let call, run;
                if (name !== undefined) {
                    let schema = runner.getSchema(name);
                    if (schema === undefined)
                        return this.unknownEntity(res, name);
                    call = schema.call;
                    run = schema.run;
                    if (this.validEntity(res, call, entityType) === false)
                        return;
                }
                let body = isGet === true ? req.query : req.body;
                let result = yield processer(unit, userId, name, db, params, runner, body, call, run);
                res.json({
                    ok: true,
                    res: result
                });
            }
            catch (err) {
                res.json({ error: err });
            }
        });
        this.net = net;
    }
    post(router, path, processer) {
        router.post(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.process(req, res, processer, req.body, req.params);
        }));
    }
    ;
    get(router, path, processer) {
        router.get(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.process(req, res, processer, req.query, req.params);
        }));
    }
    ;
    put(router, path, processer) {
        router.put(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.process(req, res, processer, req.body, req.params);
        }));
    }
    ;
    entityPost(router, entityType, path, processer) {
        router.post(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityProcess(req, res, entityType, processer, false);
        }));
    }
    ;
    entityGet(router, entityType, path, processer) {
        router.get(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityProcess(req, res, entityType, processer, true);
        }));
    }
    ;
    entityPut(router, entityType, path, processer) {
        router.put(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityProcess(req, res, entityType, processer, false);
        }));
    }
    ;
    checkRunner(db, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let runner = yield this.net.getRunner(db);
            if (runner !== undefined)
                return runner;
            res.json({
                error: {
                    no: apiErrors.databaseNotExists,
                    message: 'Database ' + db + ' 不存在'
                }
            });
        });
    }
    getRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.net.getRunner(name);
        });
    }
    /*
    private runners: {[name:string]: Runner} = {};

    async getRunner(name:string):Promise<Runner> {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {
            let db = getDb(name);
            let isExists = await db.exists();
            if (isExists === false) {
                this.runners[name] = null;
                return;
            }
            runner = new Runner(db);
            this.runners[name] = runner;
        }
        await runner.init();
        return runner;
    }
    */
    unknownEntity(res, name) {
        res.json({ error: 'unknown entity: ' + name });
    }
    validEntity(res, schema, type) {
        if (schema.type === type)
            return true;
        if (type === 'schema')
            return true;
        res.json({ error: schema.name + ' is not ' + type });
        return false;
    }
}
exports.RouterBuilder = RouterBuilder;
exports.prodRouterBuilder = new RouterBuilder(net_1.prodNet);
exports.testRouterBuilder = new RouterBuilder(net_1.testNet);
//# sourceMappingURL=routerBuilder.js.map