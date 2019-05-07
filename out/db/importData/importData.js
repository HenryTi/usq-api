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
const fs = require("fs");
const field_1 = require("./field");
// 导入文件表头
// $id  $owner  字段1    字段2   字段3@字段2
// 字段3是div，其owner是字段2
// 如果是div entity，则必须有$owner字段
// 如果字段描述：字段3@/字段2，那么，div的no就是 owner的no/div no；
const bufferSize = 7;
class ImportData {
    //protected fieldColl: {[name:string]: Field} = {};
    constructor(logger = console) {
        //protected header: Header = {};
        this.fields = [];
        this.logger = logger;
    }
    // entity: 'product';
    // entity: 'product-pack'
    static exec(runner, db, entity, div, schema, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let importData;
            let { type } = schema;
            switch (type) {
                case 'tuid':
                    if (div === undefined)
                        importData = new ImportTuid();
                    else
                        importData = new ImportTuidDiv();
                    break;
                case 'map':
                    importData = new ImportMap();
                    break;
            }
            importData.runner = runner;
            importData.db = db;
            importData.entity = entity;
            importData.div = div;
            importData.schema = schema;
            importData.filePath = filePath;
            yield importData.importData();
        });
    }
    readLine() {
        let ret = [];
        let loop = true;
        while (loop) {
            let len = this.buffer.length;
            let cur, c = 0;
            let i = this.p;
            for (; i < len; i++) {
                c = this.buffer.charCodeAt(i);
                if (c === 65279)
                    continue; // UTF8-BOM
                if (c === 9) {
                    cur = i;
                    break;
                }
                if (c === 10) {
                    cur = i;
                    loop = false;
                    break;
                }
            }
            let val;
            if (i === len) {
                if (this.p === 0)
                    this.bufferPrev = this.bufferPrev + this.buffer;
                else
                    this.bufferPrev = this.buffer.substring(this.p);
                this.buffer = null; //this.rs.read(bufferSize);
                if (this.buffer === null) {
                    if (this.bufferPrev === '' || ret.length === 0)
                        return;
                    val = this.bufferPrev;
                    loop = false;
                }
            }
            else {
                if (this.p === 0) {
                    val = this.bufferPrev + this.buffer.substring(0, cur);
                    this.bufferPrev = '';
                }
                else {
                    val = this.buffer.substring(this.p, cur);
                }
                if (c === 10)
                    val = val.trim();
                this.p = cur + 1;
            }
            ret.push(val);
        }
        if (ret.length === 1 && ret[0] === '')
            return [];
        return ret;
    }
    to(type, val) {
        if (val === undefined || val === '')
            return undefined;
        switch (type) {
            default: return val;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'bigint':
            case 'dec': return Number(val);
        }
    }
    buildHeader(line) {
        let header = {};
        let len = line.length;
        let divOwner = [];
        for (let i = 0; i < len; i++) {
            let f = line[i];
            let pos = f.indexOf('@');
            if (pos > 0) {
                let p0 = f.substr(0, pos);
                let p1 = f.substr(pos + 1);
                header[p0] = i;
                divOwner.push({ div: p0, owner: p1 });
            }
            else {
                header[line[i]] = i;
            }
        }
        for (let i = 0; i < divOwner.length; i++) {
            let { div, owner } = divOwner[i];
            if (owner[0] === '/') {
                owner = owner.substr(1);
            }
            let ownerIndex = header[owner];
            if (ownerIndex === undefined) {
                this.logger.log(`${div} of ${owner} not exists`);
                return false;
            }
            header[div + '$owner'] = ownerIndex;
        }
        let neededFields = this.checkHeader(header);
        if (neededFields !== undefined) {
            this.logger.log('导入表必须包含字段：', neededFields);
            return false;
        }
        for (let i = 0; i < len; i++) {
            let field = field_1.Field.create(this.runner, this.schema, line[i], header);
            this.fields.push(field);
        }
        return true;
    }
    importData() {
        return __awaiter(this, void 0, void 0, function* () {
            debugger;
            this.bufferPrev = '';
            this.buffer = yield readFileAsync(this.filePath, 'utf8');
            this.p = 0;
            // build header
            for (;;) {
                let line = this.readLine();
                if (line === undefined)
                    break;
                if (line.length === 0)
                    continue;
                if (this.buildHeader(line) === false)
                    return;
                break;
            }
            for (;;) {
                let line = this.readLine();
                if (line === undefined)
                    break;
                if (line.length === 0)
                    continue;
                yield this.saveItem(line);
            }
        });
    }
    checkHeader(header) { return undefined; }
    ;
    saveItem(line) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = [];
            let len = line.length;
            for (let i = 0; i < len; i++) {
                let field = this.fields[i];
                let v;
                if (field !== undefined) {
                    let v = field.getValue(line);
                    if (v === null) {
                        v = yield field.getId(line);
                    }
                }
                values.push(v);
            }
            this.logger.log(values);
        });
    }
}
exports.ImportData = ImportData;
class ImportTuid extends ImportData {
    saveItem(line) {
        const _super = Object.create(null, {
            saveItem: { get: () => super.saveItem }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.saveItem.call(this, line);
        });
    }
}
class ImportTuidDiv extends ImportTuid {
    checkHeader(header) {
        let $owner = header['$owner'];
        if ($owner !== undefined)
            return undefined;
        return ['$owner'];
    }
    ;
}
class ImportMap extends ImportData {
    saveItem(line) {
        const _super = Object.create(null, {
            saveItem: { get: () => super.saveItem }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.saveItem.call(this, line);
        });
    }
}
function readFileAsync(filename, code) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            try {
                fs.readFile(filename, code, function (err, buffer) {
                    if (err)
                        reject(err);
                    else
                        resolve(buffer);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    });
}
;
//# sourceMappingURL=importData.js.map