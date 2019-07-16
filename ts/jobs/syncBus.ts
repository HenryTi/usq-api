import { Runner, consts, Net } from "../core";
//import { getOpenApi } from "./openApi";

interface SyncFace {
    unit: number;
    faces: string;
    faceUnitMessages: string;
}

interface Face {
    id: number;
    bus: string;
    faceUrl: string;
    face: string;
}

interface SyncFaces {
    faceColl: {[faceUrl:string]: Face};
    syncFaceArr: SyncFace[];
}

export async function syncBus(runner: Runner, net: Net) {
    try {
        let db = runner.getDb();
        //if (db === 'salestask') debugger;
        console.log('syncBus: ' + db);
        for (;;) {
            let syncFaces = await getSyncFaces(runner);
            if (syncFaces === undefined) return;
            let count = 0;
            let {faceColl, syncFaceArr} = syncFaces;
            for (let syncFace of syncFaceArr) {
                let {unit, faces, faceUnitMessages} = syncFace;
                let openApi = await net.getOpenApi(consts.$$$unitx, unit);
                let ret = await openApi.bus(unit, faces, faceUnitMessages);
                let retLen = ret.length
                if (retLen === 0) continue;
                count += retLen;
                for (let row of ret) {
                    let {face:faceUrl, id:msgId, body} = row;
                    let {bus, face, id:faceId} = faceColl[faceUrl];
                    await runner.bus(bus, face, unit, faceId, msgId, body);
                }
            }
            if (count === 0) break;
        }
    }
    catch (err) {
        //debugger;
        if (err && err.message) console.error(err.message);
    }
}

async function getSyncFaces(runner: Runner): Promise<SyncFaces> {
    let syncFaces:any;
    try {
        syncFaces = await runner.call('$sync_faces', []);
    }
    catch (err) {
        syncFaces = await runner.call('$sync_faces_dev', []);
    }
    let arr0:any[] = syncFaces[0];
    let arr1:any[] = syncFaces[1];
    if (arr0.length === 0) return;
    let faceColl: {[faceUrl:string]: Face} = {};
    let faceArr:string[] = arr0.map(v => {
        let {id, bus, busOwner, busName, faceName} = v;
        let faceUrl = `${busOwner}/${busName}/${faceName}`;
        faceColl[faceUrl] = {id:id, bus:bus, faceUrl:faceUrl, face:faceName};
        return `${id}\t${faceUrl}`;
    });

    let unitFaceMsgs:{[unit:number]: {face:number;msgId:number}[]} = {};
    for (let row of arr1) {
        let {face, unit, msgId} = row;
        let faceMsgs:{face:number;msgId:number}[] = unitFaceMsgs[unit];
        if (faceMsgs === undefined) {
            unitFaceMsgs[unit] = faceMsgs = [];
        }
        faceMsgs.push({face:face, msgId:msgId});
    }

    let faces = faceArr.join('\n');
    let syncFaceArr: SyncFace[] = [];
    let ret:SyncFaces = {
        faceColl: faceColl,
        syncFaceArr: syncFaceArr
    };
    for (let unit in unitFaceMsgs) {
        let faceMsgs = unitFaceMsgs[unit];
        let msgArr:string[] = faceMsgs.map(v => {
            let {face, msgId} = v;
            if (msgId === null) msgId = 0;
            return `${face}\t${unit}\t${msgId}`;
        });
        syncFaceArr.push({unit:Number(unit), faces:faces, faceUnitMessages: msgArr.join('\n')});
    }
    return ret;
}

