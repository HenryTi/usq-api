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
const router_1 = require("./router");
const processRequest_1 = require("./processRequest");
const tuidType = 'tuid';
function default_1(router) {
    processRequest_1.get(router, tuidType, '/:name/:id', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id, name } = params;
        let result = yield runner.tuidGet(name, unit, user, id);
        let arr0 = result[0];
        let value = undefined;
        if (arr0.length > 0) {
            value = arr0[0];
            let { arrs } = schema;
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i = 0; i < len; i++) {
                    value[arrs[i].name] = result[i + 1];
                }
            }
        }
        return value;
    }));
    processRequest_1.get(router, tuidType, '-arr/:name/:owner/:arr/:id/', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id, name, owner, arr } = params;
        let schemaArr = router_1.getTuidArr(schema, arr);
        let result = yield runner.tuidArrGet(name, arr, unit, user, owner, id);
        let row = result[0];
        return row;
    }));
    processRequest_1.get(router, tuidType, '-all/:name/', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { name } = params;
        let result = yield runner.tuidGetAll(name, unit, user);
        return result;
    }));
    processRequest_1.get(router, tuidType, '-arr-all/:name/:owner/:arr/', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { name, owner, arr } = params;
        let schemaArr = router_1.getTuidArr(schema, arr);
        let result = yield runner.tuidGetArrAll(name, arr, unit, user, owner);
        return result;
    }));
    processRequest_1.get(router, tuidType, '-proxy/:name/:type/:id', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id, type, name } = params;
        let result = yield runner.tuidProxyGet(name, unit, user, id, type);
        let row = result[0];
        return row;
    }));
    processRequest_1.post(router, tuidType, '/:name', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { name } = params;
        let id = body["$id"];
        let dbParams = [id];
        let fields = schema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            dbParams.push(body[fields[i].name]);
        }
        let result = yield runner.tuidSave(name, unit, user, dbParams);
        let row = result[0];
        if (!id)
            id = row.id;
        if (id < 0)
            id = -id;
        if (id > 0) {
            let { arrs } = schema;
            if (arrs !== undefined) {
                for (let arr of arrs) {
                    let arrName = arr.name;
                    let fields = arr.fields;
                    let arrValues = body[arrName];
                    if (arrValues === undefined)
                        continue;
                    for (let arrValue of arrValues) {
                        let arrParams = [id, arrValue[arr.id]];
                        let len = fields.length;
                        for (let i = 0; i < len; i++) {
                            arrParams.push(arrValue[fields[i].name]);
                        }
                        yield runner.tuidArrSave(name, arrName, unit, user, arrParams);
                    }
                }
            }
        }
        return row;
    }));
    processRequest_1.post(router, tuidType, '-arr/:name/:owner/:arr/', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { name, owner, arr } = params;
        let schemaArr = router_1.getTuidArr(schema, arr);
        let id = body["$id"];
        let dbParams = [owner, id];
        let fields = schemaArr.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            dbParams.push(body[fields[i].name]);
        }
        let result = yield runner.tuidArrSave(name, arr, unit, user, dbParams);
        let row = result[0];
        return row;
    }));
    processRequest_1.post(router, tuidType, '-arr-pos/:name/:owner/:arr/', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { name, owner, arr } = params;
        let { $id, $order } = body;
        let dbParams = [owner, $id, $order];
        let result = yield runner.tuidArrPos(name, arr, unit, user, dbParams);
        return undefined;
    }));
    processRequest_1.post(router, tuidType, 'ids/:name/:arr', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { name, arr } = params;
        let ids = body.join(',');
        let result = yield runner.tuidIds(name, arr, unit, user, ids);
        return result;
    }));
    processRequest_1.post(router, tuidType, 's/:name', (unit, user, db, runner, params, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { name } = params;
        let { arr, owner, key, pageStart, pageSize } = body;
        let result = arr === undefined ?
            yield runner.tuidSeach(name, unit, user, arr, key, pageStart, pageSize)
            :
                yield runner.tuidArrSeach(name, unit, user, arr, owner, key, pageStart, pageSize);
        let rows = result[0];
        return rows;
    }));
}
exports.default = default_1;
;
//# sourceMappingURL=tuid.js.map