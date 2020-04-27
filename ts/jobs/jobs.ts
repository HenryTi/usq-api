import * as _ from 'lodash';
import { Net, Db, isDevelopment, prodNet, testNet, isDevdo } from '../core';
import { pullEntities } from './pullEntities';
import { pullBus } from './pullBus';
import { queueIn } from './queueIn';
import { queueOut } from './queueOut';

const firstRun: number = isDevelopment === true? 3000 : 30*1000;
const runGap: number = isDevelopment === true? 15*1000 : 30*1000;
const waitForOtherStopJobs = 1*1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';

function sleep(ms: number):Promise<void> {
    return new Promise<void>((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

let loopWait: boolean = true;
export function jobsLoopNoWait() {
    loopWait = false;
}

export async function startJobsLoop(): Promise<void> {
	let db = Db.db(undefined);
    if ( isDevelopment === true || isDevdo === true) {
        // 只有在开发状态下，才可以屏蔽jobs
        return;
        console.log(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
        await db.setDebugJobs();
        await sleep(waitForOtherStopJobs);
    }
    else {
        await sleep(firstRun);
    }

    console.log('Jobs loop started!');
    for (;;) {
        console.log();
        console.error('===================== jobs loop once ===================')
        try {
            let uqs = await db.uqDbs();
            for (let uqRow of uqs) {
                let {db:uqDb} = uqRow;
                if (isDevelopment as any === true) {
                    await db.setDebugJobs();
                }
                console.info('====== job loop for ' + uqDb + '======');
                let net:Net;
                let dbName:string;;
                if (uqDb.endsWith($test) === true) {
                    dbName = uqDb.substr(0, uqDb.length - $test.length);
                    net = testNet;
                }
                else {
                    dbName = uqDb;
                    net = prodNet;
                }
                let runner = await net.getRunner(dbName);
                if (runner === undefined) continue;
                let {buses} = runner;
                if (buses !== undefined) {
                    let {outCount, faces} = buses;
                    if (outCount > 0 || runner.hasSheet === true) {
                        await queueOut(runner);
                    }
                    if (faces !== undefined) {
                        await pullBus(runner);
                        await queueIn(runner);
                    }
                }
                await pullEntities(runner);
            }
        }
        catch (err) {
            console.error('jobs loop error!!!!');
            console.error(err);
            let errText:string = '';
            if (err === null) {
                errText = 'null';
            }
            else {
                switch (typeof err) {
                    default: errText = err; break;
                    case 'string': errText = err; break;
                    case 'undefined': errText = 'undefined'; break;
                    case 'object': errText = 'object: ' + err.messsage; break;
                }
            }
            await db.log(0, '$jobs', '$jobs loop error', errText);
        }
        finally {
            if (loopWait === true) {
                await sleep(runGap);
            }
            else {
                loopWait = true;
            }
        }
    }
}
