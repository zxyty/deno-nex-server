import {
  querystringify,
  ServerRequest,
  Response,
  serve,
  Server,
} from "./deps.ts";
import NexResponse from "./response.ts";
import { NexRequest } from "./request.ts";
import MiddlewareRoute from "./routeInterface.ts";

const decoder = new TextDecoder();

interface NexServerProps {
  port?: number;
}

class NexServer {
  private middlewares = new Map();

  private serverConfig: NexServerProps = { port: 3001 };

  private server: Server | null = null;

  constructor(options: NexServerProps = {}) {
    Object.assign(this.serverConfig, options);

    this.start = this.start.bind(this);
    this.dispatch = this.dispatch.bind(this);
  }

  use(handler: Function | MiddlewareRoute) {
    this.middlewares.set(handler, handler);
    return this;
  }

  async start() {
    this.server = serve({
      port: this.serverConfig.port!,
    });
    console.log(`http://localhost:${this.serverConfig.port}/`);
    for await (const request of this.server) {
      this.dispatch(request);
    }
  }

  private async dispatch(request: ServerRequest) {
    const { req, res } = await this.parseRequest(request);
    let i = 0;
    for (let handler of this.middlewares) {
      i++;
      let canNextMiddleware = true;
      let runError = null;
      await handler[1](
        req,
        res,
        (err?: Error) => {
          canNextMiddleware = !err;
          runError = err;
        },
      );
      if (runError) {
        res.send500(runError);
        return;
      }
      if (!canNextMiddleware) {
        res.send404();
        return;
      }
    }
  }

  private converToRes = (respond: (r: Response) => Promise<void>) => {
    return new NexResponse(respond);
  };

  private converToBody = (
    body: string,
    contentType: string = "application/json",
  ) => {
    if (!body) {
      return {};
    }

    if (contentType === "application/json") {
      return JSON.parse(body);
    }

    return body;
  };

  private parseHeaders = (headers: Headers) => {
    const parsedHeaders: any = {};
    headers.forEach((value, key) => {
      parsedHeaders[String(key).toLocaleLowerCase()] = value;
    });

    return parsedHeaders;
  };

  private parseRequest = async (request: ServerRequest) => {
    const { url, method, proto, headers, body, respond } = request;
    const rawBody = await Deno.readAll(body);
    const bodyRow = decoder.decode(rawBody);
    const query = querystringify.parse(String(url).split("?")[1] || "");
    const requestHeaders = this.parseHeaders(headers);
    return {
      req: {
        ctx: {},
        url,
        query,
        method,
        proto,
        headers: requestHeaders,
        body: this.converToBody(bodyRow, requestHeaders["content-type"]),
      } as NexRequest,
      res: this.converToRes(respond.bind(request)),
    };
  };
}

export default NexServer;
