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
function buildSchemaRouter(router, rb) {
    rb.get(router, '/schema/:name', (runner, body, urlParams) => __awaiter(this, void 0, void 0, function* () {
        let { name } = urlParams;
        let schema = runner.getSchema(name);
        return schema && schema.call;
    }));
    rb.get(router, '/schema/:name/:version', (runner, body, urlParams) => __awaiter(this, void 0, void 0, function* () {
        let { name, version } = urlParams;
        let schemaVersion = yield runner.loadSchemaVersion(name, version);
        return schemaVersion;
    }));
}
exports.buildSchemaRouter = buildSchemaRouter;
//# sourceMappingURL=schema.js.map