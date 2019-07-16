import { centerApi, Runner, ClientMessage } from "../core";

// 现在简单的把client message推送给center，由center来分发给client
// 以后需要做client消息分发服务器
export async function pushToClient(unitxRunner:Runner, msg: ClientMessage):Promise<void> {
    try {
        await centerApi.pushTo(msg);
    }
    catch (err) {
        console.error(err);
    }
}
