"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSheetRouter = void 0;
const core_1 = require("../core");
const constSheet = 'sheet';
function buildSheetRouter(router, rb) {
    function queueSheet(runner, unit, name, sheetId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield runner.unitTableFromProc('tv_$sheet_to_queue', unit, name, sheetId, JSON.stringify(content));
            return (ret[0].ret === 1);
        });
    }
    function directSheet(runner, unit, name, sheetId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            let { state, action, flow, user } = content;
            let ret = yield runner.sheetAct(name, state, action, unit, user, sheetId, flow);
            //let ret = await runner.unitTableFromProc('tv_$sheet_to_queue', unit, name, sheetId, JSON.stringify(content));
            return ret[0];
        });
    }
    rb.entityPost(router, constSheet, '/:name', (unit, user, name, db, urlParams, runner, body, schema, run) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        let { app, discription, data } = body;
        try {
            let verify = yield runner.sheetVerify(name, unit, user, data);
            if (verify !== undefined) {
                return { error: verify };
            }
            let result = yield runner.sheetSave(name, unit, user, app, discription, data);
            let sheetRet = result[0];
            if (sheetRet !== undefined) {
                //let states:any[] = schema.states;
                let startState = (_a = run === null || run === void 0 ? void 0 : run.run) === null || _a === void 0 ? void 0 : _a['$']; // states.find(v => v.name === '$');
                if (startState !== undefined) {
                    let $onsave = startState['$onsave'];
                    if ($onsave !== undefined) {
                        let { id, flow } = sheetRet;
                        let retQueue = yield queueSheet(runner, unit, name, id, {
                            sheet: name,
                            state: '$',
                            action: '$onsave',
                            unit: unit,
                            user: user,
                            id: id,
                            flow: flow,
                        });
                    }
                }
            }
            return sheetRet;
        }
        catch (err) {
            yield runner.log(unit, 'sheet save ' + name, data);
        }
    }));
    rb.entityPost(router, constSheet, '/:name/direct', (unit, user, name, db, urlParams, runner, body, schema, run) => __awaiter(this, void 0, void 0, function* () {
        var _b;
        let { app, discription, data } = body;
        try {
            let verify = yield runner.sheetVerify(name, unit, user, data);
            if (verify !== undefined) {
                return { verify };
            }
            let result = yield runner.sheetSave(name, unit, user, app, discription, data);
            let sheetRet = result[0];
            if (sheetRet !== undefined) {
                //let states:any[] = schema.states;
                let startState = (_b = run === null || run === void 0 ? void 0 : run.run) === null || _b === void 0 ? void 0 : _b['$']; // states.find(v => v.name === '$');
                if (startState !== undefined) {
                    let $onsave = startState['$onsave'];
                    if ($onsave !== undefined) {
                        let { id, flow } = sheetRet;
                        let retQueue = yield directSheet(runner, unit, name, id, {
                            sheet: name,
                            state: '$',
                            action: '$onsave',
                            unit: unit,
                            user: user,
                            id: id,
                            flow: flow,
                        });
                    }
                }
            }
            return sheetRet;
        }
        catch (err) {
            yield runner.log(unit, 'sheet save ' + name, data);
        }
    }));
    rb.entityPut(router, constSheet, '/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { state, action, id, flow } = body;
        let retQueue = yield queueSheet(runner, unit, name, id, {
            sheet: name,
            state: state,
            action: action,
            unit: unit,
            user: user,
            id: id,
            flow: flow,
        });
        // 这个地方以后需要更多的判断和返回。提供给界面操作
        if (retQueue === false)
            throw {
                type: 'sheet-processing',
                message: '不可以同时操作单据'
            };
        return { msg: 'add to queue' };
    }));
    rb.entityPut(router, constSheet, '/:name/direct', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { state, action, id, flow } = body;
        let ret = yield directSheet(runner, unit, name, id, {
            sheet: name,
            state: state,
            action: action,
            unit: unit,
            user: user,
            id: id,
            flow: flow,
        });
        // 这个地方以后需要更多的判断和返回。提供给界面操作
        /*
        if (retQueue === false) throw {
            type: 'sheet-processing',
            message: '不可以同时操作单据'
        };
        return {msg: 'add to queue'};
        */
        return ret;
    }));
    rb.entityPost(router, constSheet, '/:name/states', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { state, pageStart, pageSize } = body;
        let result = yield runner.sheetStates(name, state, unit, user, pageStart, pageSize);
        return result;
    }));
    rb.entityGet(router, constSheet, '/:name/statecount', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.sheetStateCount(name, unit, user);
        return result;
    }));
    rb.entityPost(router, constSheet, '/:name/user-sheets', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { state, user: sheetUser, pageStart, pageSize } = body;
        let result = yield runner.userSheets(name, state, unit, user, sheetUser, pageStart, pageSize);
        return result;
    }));
    rb.entityPost(router, constSheet, '/:name/my-sheets', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { state, pageStart, pageSize } = body;
        let result = yield runner.mySheets(name, state, unit, user, pageStart, pageSize);
        return result;
    }));
    rb.entityGet(router, constSheet, '-scan/:name/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.sheetScan(name, unit, user, id);
        let main = result[0];
        if (main === undefined)
            return;
        let data = main.data;
        let json = core_1.unpack(schema, data);
        main.data = json;
        return main;
    }));
    rb.entityGet(router, constSheet, '/:name/get/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.getSheet(name, unit, user, id);
        return result;
    }));
    rb.entityPost(router, constSheet, '/:name/archives', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { pageStart, pageSize } = body;
        let result = yield runner.sheetArchives(name, unit, user, pageStart, pageSize);
        return result;
    }));
    rb.entityGet(router, constSheet, '/:name/archive/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.sheetArchive(unit, user, name, id);
        return result;
    }));
}
exports.buildSheetRouter = buildSheetRouter;
//# sourceMappingURL=sheet.js.map