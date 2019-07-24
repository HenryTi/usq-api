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
const fetch_1 = require("./fetch");
class UnitxApi extends fetch_1.Fetch {
    send(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('', msg);
            return ret;
        });
    }
    fetchBus(unit, msgStart, faces) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('fetch-bus', {
                unit: unit,
                msgStart: msgStart,
                faces: faces,
            });
            return ret;
        });
    }
}
exports.UnitxApi = UnitxApi;
//# sourceMappingURL=unitxApi.js.map