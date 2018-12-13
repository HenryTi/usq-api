import {Router, Request, Response, NextFunction} from 'express';
import { Runner, getRunner } from '../../db';
import { consts } from '../../core';
import { writeDataToBus } from '../../queue/processBusMessage';

export const router: Router = Router({ mergeParams: true });

router.get('/:unit/:jointName', async (req: Request, res: Response) => {
    await routerProcess(req, res, readBus);
});

router.post('/:unit/:jointName', async (req: Request, res: Response) => {
    await routerProcess(req, res, writeBus);
});

function getClientIp(req:Request) {
    return req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;
};

function getIp(_http:Request) {
    var ipStr = _http.headers['X-Real-IP'] || _http.headers['x-forwarded-for'];
    if (ipStr) {
        var ipArray = ipStr.split(",");
        if (ipArray || ipArray.length > 0) {
            //如果获取到的为ip数组
            return ipArray[0];
        }
    }
    else {
        //获取不到时
        return _http.ip.substring(_http.ip.lastIndexOf(":") + 1);
    }
};

function getNetIp(_http: Request) {
    var ipStr = _http.headers['X-Real-IP'] || _http.headers['x-forwarded-for'];
    if (ipStr) {
        var ipArray = ipStr.split(",");
        if (ipArray.length > 1) {
            //如果获取到的为ip数组
            for (var i = 0; i < ipArray.length; i++) {
                var ipNumArray = ipArray[i].split(".");
                var tmp = ipNumArray[0] + "." + ipNumArray[1];
                if (tmp == "192.168" || 
                    (ipNumArray[0] == "172" && ipNumArray[1] >= 16 && ipNumArray[1] <= 32) || tmp == "10.7")
                {
                    continue;
                }
                return ipArray[i];
            }
        }
        return ipArray[0];	
    } 
    else {
        //获取不到时
        return _http.ip.substring(_http.ip.lastIndexOf(":") + 1);
    }
};

async function routerProcess(req: Request, res: Response, 
    action: (req: Request, res: Response, runner:Runner, unit:number, joint:any) => Promise<void>) 
{
    try {
        let {unit, jointName} = req.params;
        let runner = await getRunner(consts.$unitx);
        let joint = await getJoint(req, runner, unit, jointName);
        if (Array.isArray(joint)) {
            res.end('<div>Your IP ' + joint[0] + ' is not valid for joint <b>'+jointName+'</b>!</div>');
            return;
        }
        await action(req, res, runner, unit, joint);
    }
    catch (err) {
        res.end('error: ' + err.message);
    }
}

const myIps:string[] = ['1', '::1', '127.0.0.1', '::ffff:127.0.0.1'];
function validIp(regIp:string, ips:string[]):boolean {
    for (let ip of ips) {
        if (myIps.find(v => v === ip) !== undefined) return true;
        if (ip === regIp) return true;
    }
    return false;
}

var lastJoint:any;
async function getJoint(req:Request, runner: Runner, unit:number, jointName:string) {
    let reqIP = getClientIp(req);
    let innerIP = getIp(req);
    let netIP = getNetIp(req);
    if (lastJoint !== undefined) {
        let {name, ip} = lastJoint;
        if (name === jointName && validIp(ip, [innerIP, netIP]) === true)
        {
            return lastJoint;
        }
    }

    let jointRet = await runner.tuidSeach('joint', unit, undefined, undefined, jointName, 0, 1);
    let t0 = jointRet[0];
    if (t0.length > 0) {
        let joint = t0[0];
        let {name, ip} = joint;
        if (name === jointName && validIp(ip, [innerIP, netIP]) === true)
        {
            joint.$ip = netIP || innerIP || reqIP;
            return lastJoint = joint;
        }
    }
    return [innerIP, netIP, reqIP];
}

async function readBus(req: Request, res: Response, runner:Runner, unit:number, joint:any) {
    let {name, discription, facesIn, facesOut, $ip} = joint;
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.write('<div>in ip ' + getIp(req) + 
        ' out ip ' + getNetIp(req) + 
        ' cliet ip ' + getClientIp(req) + '</div><br/><br/>');
    res.write('<h4>交换机: ' + name + '</h4>');
    res.write('<h5>' + discription + '</h5>');
    res.write('<div>IP: ' + $ip + '</div>');
    res.write('<br/>');
    if (facesIn) {
        res.write('<h5>写入接口</h5>');
        (facesIn as string).split('\n').forEach(v => {
            res.write('<div>' + v + '</div>');
        });
    }
    res.write('<br/>');
    if (facesOut) {
        res.write('<h5>读出接口</h5>');
        (facesOut as string).split('\n').forEach(v => {
            res.write('<div>' + v + '</div>');
        });
    }
    
    res.write('<br/>');
    res.write('<br/>');
    let data = '1\t2\ta38\n3\t2\t1543678133000\t\n\n\n';
    res.write(
`<pre>
sample post:
[
    {face: "$$$/test/complex1", queue: 0, data: undefined},
    {face: "$$$/test/complex1", queue: undefined, data: ${JSON.stringify(data)}}
]

sample data:
${data}

sample bus:
{
    "schema1": [
        {"name": "a1", "type": "string"},
        {"name": "a2", "type": "number"},
        {"name": "a3", "type": "date"},
        {"name": "a4", "type": "id"},
    ],
    "schema2": [
        {"name": "a3", "type": "string"},
        {"name": "cb2", "type": "number"},
        {"name": "aa3", "type": "date"}
    ],
    "complex1": [
        {"name": "a1", "type": "string"},
        {"name": "c3", "type": "string"},
        {"name": "bbba37", "type": "string"},
        {"name": "arrName", "fields": "schema1"}
    ]
}
</pre>`);
    // res.write('<form action="./'+ name + '" method="post"><button type="submit">submit</button></form>');

    res.end();
}

// [
//    {face: 'owner/bus/face', queue: 0}
// ]
interface Ticket {
    face: string;
    queue: number;
    data: string;
};
async function writeBus(req: Request, res: Response, runner:Runner, unit:number, joint:any) {
    let tickets:Ticket[] = req.body;
    if (Array.isArray(tickets) === false) tickets = [tickets as any];
    /*
    if (!tickets) {
        res.json({});
        return;
    }

    tickets = [
        {face: '$$$/test/complex1', queue: 0, data: undefined},
        {face: '$$$/test/complex1', queue: undefined, data: '1\t2\ta38\n3\t2\t1543678133000\t\n\n\n'}
    ];
    */
    /*
    let faces = [
        {id: 1, face: '$$$/test/complex1'}
    ];
    let unitMsgs = [
        {face: 1, unit: unit, msgId: 0}
    ];*/
    let {name, facesIn, facesOut} = joint;
    let faces:{id:number; face:string}[] = []
    let unitMsgs:{face:number; unit:number; msgId:number}[] = [];

    let seed = 1;
    let dict:{[face:string]:number} = {};
    let dictn:{[n:number]:string} = {};
    for (let ticket of tickets) {
        let {face, queue, data} = ticket;
        if (face === undefined) continue;        
        if (data !== undefined) {
            // 写bus
            if (facesIn === null) continue;
            if ((facesIn as string).indexOf(face) < 0) continue;
            await writeDataToBus(runner, face, unit, name, data);
        }
        else {
            if (facesOut === null) continue;
            if ((facesOut as string).indexOf(face) < 0) continue;
            let faceId = dict[face];
            if (faceId === undefined) {
                dict[face] = faceId = seed++;
                dictn[faceId] = face;
                faces.push({id: faceId, face: face});
            }
            unitMsgs.push({face: faceId, unit: unit, msgId: queue});
        }
    }

    if (seed > 1) {
        let facesText = faces.map(v => v.id + '\t' + v.face).join('\n');
        let faceUnitMessages = unitMsgs.map(v => v.face + '\t' + v.unit + '\t' + v.msgId);
        let ret = await runner.call(consts.GetBusMessages, [undefined, undefined, facesText, faceUnitMessages]);
        for (let row of ret) {
            row.face = dictn[row.face];
        }
        res.json(ret);
    }
    else {
        res.json([]);
    }
}