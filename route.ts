import RouteInterface from "./routeInterface.ts";
import { NexRequest } from "./request.ts";
import NexResponse from "./response.ts";

class Route extends RouteInterface {
  private _setListener = (method: string, ...args: any[]) => {
    const [path, listener] = args;
    this.handler.push({
      method,
      path,
      listener,
    });
  };

  get = (...args: any[]) => {
    this._setListener("get", ...args);
    return this;
  };

  post = (...args: any[]) => {
    this._setListener("post", ...args);
    return this;
  };

  patch = (...args: any[]) => {
    this._setListener("patch", ...args);
    return this;
  };

  delete = (...args: any[]) => {
    this._setListener("delete", ...args);
    return this;
  };

  put = (...args: any[]) => {
    this._setListener("put", ...args);
    return this;
  };

  private dispatch = async (
    req: NexRequest,
    res: NexResponse,
    next: Function,
  ) => {
    try {
      const { url = "", method = "" } = req;
      const { route, params } = this.getMatchedRoute(url!, method!);
      if (route) {
        await route({ ...req, params }, res);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

const _route = new Route() as any;

const proxy = new Proxy(_route.dispatch, {
  get(self, name) {
    return _route[name];
  },
  set(self, name, value) {
    _route[name] = value;
    return true;
  },
}) as Route;

export default proxy;
