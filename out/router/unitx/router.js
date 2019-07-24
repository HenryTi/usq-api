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
const express_1 = require("express");
const core_1 = require("../../core");
const messageProcesser_1 = require("./messageProcesser");
function buildUnitxRouter(rb) {
    let router = express_1.Router();
    router.post('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            let msg = req.body;
            let tos = undefined;
            let { type } = msg;
            let unitxRunner = yield rb.getUnitxRunner();
            if (type === 'sheet') {
                let sheetMessage = msg;
                let { from } = sheetMessage;
                tos = yield getSheetTos(unitxRunner, sheetMessage);
                if (tos === undefined || tos.length === 0)
                    tos = [from];
                sheetMessage.to = tos;
            }
            //await queueUnitxIn(msg);
            let mp = messageProcesser_1.messageProcesser(msg);
            yield mp(unitxRunner, msg);
            console.log('await queueUnitxIn(msg)', msg);
            res.json({
                ok: true,
                res: tos,
            });
        }
        catch (e) {
            res.json({
                ok: false,
                error: JSON.stringify(e),
            });
        }
    }));
    rb.post(router, '/fetch-bus', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, msgStart, faces } = body;
        let ret = yield runner.unitUserTablesFromProc('tv_GetBusMessages', unit, undefined, msgStart, faces);
        console.log(`unitx/fetch-bus - GetBusMessages - ${ret}`);
        return ret;
    }));
    rb.post(router, '/joint-read-bus', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, face, queue } = body;
        if (queue === undefined)
            queue = core_1.busQueueSeed();
        let ret = yield runner.unitUserCall('tv_BusMessageFromQueue', unit, undefined, face, queue);
        if (ret.length === 0)
            return;
        return ret[0];
    }));
    rb.post(router, '/joint-write-bus', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, face, from, sourceId, body: message } = body;
        /*
        let data = '';
        if (face !== null && face !== undefined) data += face;
        data += '\t';
        if (from !== null && from !== undefined) data += from;
        data += '\t';
        if (sourceId !== null && sourceId !== undefined) data += sourceId;
        data += '\t';
        data += message + '\n';
        */
        let ret = yield runner.unitUserCall('tv_SaveBusMessage', unit, undefined, face, from, sourceId, message);
        return ret;
    }));
    return router;
}
exports.buildUnitxRouter = buildUnitxRouter;
// 之前用 getSheetTo 查询，现在改名为 getEntityAccess
const uqGetSheetTo = 'getEntityAccess';
function getSheetTos(unitxRunner, sheetMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let { unit, body } = sheetMessage;
        let { state, user, name, no, discription, uq } = body;
        // 新单只能发给做单人
        if (state === '$')
            return;
        // 上句中的to removed，由下面调用unitx来计算
        let sheetName = name;
        let stateName = state;
        let paramsGetSheetTo = [uq, sheetName, stateName];
        let tos = yield unitxRunner.query(uqGetSheetTo, unit, user, paramsGetSheetTo);
        return tos.map(v => v.to);
    });
}
//# sourceMappingURL=router.js.map