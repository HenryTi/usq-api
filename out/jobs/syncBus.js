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
const core_1 = require("../core");
function syncBus(runner, net) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let db = runner.getDb();
            //if (db === 'salestask') debugger;
            console.log('syncBus: ' + db);
            for (;;) {
                let syncFaces = yield getSyncFaces(runner);
                if (syncFaces === undefined)
                    return;
                let count = 0;
                let { faceColl, syncFaceArr } = syncFaces;
                for (let syncFace of syncFaceArr) {
                    let { unit, faces, faceUnitMessages } = syncFace;
                    let openApi = yield net.getOpenApi(core_1.consts.$$$unitx, unit);
                    let ret = yield openApi.bus(unit, faces, faceUnitMessages);
                    let retLen = ret.length;
                    if (retLen === 0)
                        continue;
                    count += retLen;
                    for (let row of ret) {
                        let { face: faceUrl, id: msgId, body } = row;
                        let { bus, face, id: faceId } = faceColl[faceUrl];
                        yield runner.bus(bus, face, unit, faceId, msgId, body);
                    }
                }
                if (count === 0)
                    break;
            }
        }
        catch (err) {
            //debugger;
            if (err && err.message)
                console.error(err.message);
        }
    });
}
exports.syncBus = syncBus;
function getSyncFaces(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let syncFaces;
        try {
            syncFaces = yield runner.call('$sync_faces', []);
        }
        catch (err) {
            syncFaces = yield runner.call('$sync_faces_dev', []);
        }
        let arr0 = syncFaces[0];
        let arr1 = syncFaces[1];
        if (arr0.length === 0)
            return;
        let faceColl = {};
        let faceArr = arr0.map(v => {
            let { id, bus, busOwner, busName, faceName } = v;
            let faceUrl = `${busOwner}/${busName}/${faceName}`;
            faceColl[faceUrl] = { id: id, bus: bus, faceUrl: faceUrl, face: faceName };
            return `${id}\t${faceUrl}`;
        });
        let unitFaceMsgs = {};
        for (let row of arr1) {
            let { face, unit, msgId } = row;
            let faceMsgs = unitFaceMsgs[unit];
            if (faceMsgs === undefined) {
                unitFaceMsgs[unit] = faceMsgs = [];
            }
            faceMsgs.push({ face: face, msgId: msgId });
        }
        let faces = faceArr.join('\n');
        let syncFaceArr = [];
        let ret = {
            faceColl: faceColl,
            syncFaceArr: syncFaceArr
        };
        for (let unit in unitFaceMsgs) {
            let faceMsgs = unitFaceMsgs[unit];
            let msgArr = faceMsgs.map(v => {
                let { face, msgId } = v;
                if (msgId === null)
                    msgId = 0;
                return `${face}\t${unit}\t${msgId}`;
            });
            syncFaceArr.push({ unit: Number(unit), faces: faces, faceUnitMessages: msgArr.join('\n') });
        }
        return ret;
    });
}
//# sourceMappingURL=syncBus.js.map