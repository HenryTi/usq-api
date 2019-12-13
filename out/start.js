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
const express = require("express");
const express_1 = require("express");
const bodyParser = require("body-parser");
const config = require("config");
const router_1 = require("./router");
const res_1 = require("./res");
const core_1 = require("./core");
//import { /*buildUnitxQueueRouter, startSheetQueue, startToUnitxQueue, startUnitxInQueue*/ } from './queue';
const auth_1 = require("./core/auth");
const jobs_1 = require("./jobs");
const _uq_1 = require("./$uq");
//import { importData } from './import';
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
                let connection = config.get("connection");
                if (connection === undefined || connection.host === '0.0.0.0') {
                    console.log("mysql connection must defined in config/default.json or config/production.json");
                    return;
                }
                res_1.initResPath();
                var cors = require('cors');
                let app = express();
                app.use(express.static('public'));
                app.use((err, req, res, next) => {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                });
                /*
                app.use(async (req:Request, res:Response, next:NextFunction) => {
                    let r = req;
                    debugger;
                    next();
                });
                */
                app.use(bodyParser.json());
                app.use(cors());
                app.set('json replacer', (key, value) => {
                    if (value === null)
                        return undefined;
                    return value;
                });
                app.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
                    let s = req.socket;
                    let p = '';
                    if (req.method !== 'GET')
                        p = JSON.stringify(req.body);
                    let t = new Date();
                    console.log('%s-%s %s:%s - %s %s %s', t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes(), req.method, req.originalUrl, p);
                    try {
                        next();
                    }
                    catch (e) {
                        console.error(e);
                    }
                }));
                app.use('/res', res_1.router);
                app.use('/hello', dbHello);
                // 正常的tonva uq接口 uqRouter
                //let uqRouter = express.Router({ mergeParams: true });
                /*
                uqRouter.use('/', dbHello);
                uqRouter.use('/hello', dbHello);
                uqRouter.use('/unitx', [authUnitx, unitxQueueRouter]);
                uqRouter.use('/open', [authUnitx, openRouter]);
                uqRouter.use('/tv', [authCheck, router]);
                //uqRouter.use('/joint', [authJoint, router]);
                uqRouter.use('/setting', [settingRouter]); // unitx set access
                // debug tonva uq, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
                uqRouter.use('/debug', [authCheck, router]);
                */
                app.use('/uq/prod/:db/', buildUqRouter(core_1.uqProdRouterBuilder, core_1.compileProdRouterBuilder));
                app.use('/uq/test/:db/', buildUqRouter(core_1.uqTestRouterBuilder, core_1.compileTestRouterBuilder));
                app.use('/uq/unitx-prod/', router_1.buildUnitxRouter(core_1.unitxProdRouterBuilder));
                app.use('/uq/unitx-test/', router_1.buildUnitxRouter(core_1.unitxTestRouterBuilder));
                let port = config.get('port');
                console.log('port=', port);
                //let redisConfig = config.get<any>('redis');
                //let redis = {redis: redisConfig};
                //console.log('redis:', redisConfig);
                //startSheetQueue(redis);
                //startToUnitxQueue(redis);
                //startUnitxInQueue(redis);
                app.listen(port, () => __awaiter(this, void 0, void 0, function* () {
                    yield res_1.initResDb();
                    yield _uq_1.init$UqDb();
                    console.log('UQ-API listening on port ' + port);
                    let connection = config.get("connection");
                    let { host, user } = connection;
                    console.log('process.env.NODE_ENV: %s\nDB host: %s, user: %s', process.env.NODE_ENV, host, user);
                    //await importData();
                    resolve();
                    //if (startJobs === true) Jobs.start();
                    // **
                    // **
                }));
            }
            catch (err) {
                console.error(err);
            }
        });
    });
}
exports.init = init;
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        //Jobs.start();
        yield jobs_1.startJobsLoop();
    });
}
exports.start = start;
function dbHello(req, res) {
    let db = req.params.db;
    res.json({ "hello": 'uq-api: hello, db is ' + db });
}
function buildUqRouter(rb, rbCompile) {
    // 正常的tonva uq接口 uqRouter
    let uqRouter = express_1.Router({ mergeParams: true });
    let openRouter = express_1.Router({ mergeParams: true });
    router_1.buildOpenRouter(openRouter, rb);
    uqRouter.use('/open', [core_1.authUnitx, openRouter]);
    let buildRouter = express_1.Router({ mergeParams: true });
    router_1.buildBuildRouter(buildRouter, rbCompile);
    uqRouter.use('/build', [auth_1.authUpBuild, buildRouter]);
    // 这个是不是也要放到只有unitx里面
    let settingRouter = express_1.Router({ mergeParams: true });
    router_1.buildSettingRouter(settingRouter, rb);
    uqRouter.use('/setting', [settingRouter]); // unitx set access
    /* 直接放到/unitx名下了
    let unitxQueueRouter = Router({ mergeParams: true });
    buildUnitxQueueRouter(unitxQueueRouter, rb);
    uqRouter.use('/unitx', [authUnitx, unitxQueueRouter]);
    */
    let entityRouter = express_1.Router({ mergeParams: true });
    router_1.buildEntityRouter(entityRouter, rb);
    uqRouter.use('/tv', [core_1.authCheck, entityRouter]);
    uqRouter.use('/debug', [core_1.authCheck, entityRouter]);
    uqRouter.use('/joint', [auth_1.authJoint, entityRouter]);
    uqRouter.use('/', dbHello);
    uqRouter.use('/hello', dbHello);
    return uqRouter;
}
//# sourceMappingURL=start.js.map