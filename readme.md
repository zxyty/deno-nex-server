
使用

```ts
import {
    NexServer,
    NexRequest,
    NexResponse,
    router,
} from 'https://raw.githubusercontent.com/zxyty/deno-nex-server/master/mod.ts';

router
    .static("./public")
    .static("./static")
    .get("/test1", (req: NexRequest, res: NexResponse) => {
        res.cookie('test', "212").send(req);
    })
    .post("/test2", (req: NexRequest, res: NexResponse) => {
        res.send(req);
    })
    .delete("/test3/:id", (req: NexRequest, res: NexResponse) => {
        res.send(req);
    })
    .patch("/test4/:id", (req: NexRequest, res: NexResponse) => {
        res.send(req);
    })
    .put("/test5/:id/new", (req: NexRequest, res: NexResponse) => {
        res.send(req);
    });

new NexServer({port: 30001}).use(router).start();
```