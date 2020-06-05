import { pathToRegexp, path as stdPath } from "./deps.ts";
import { NexRequest } from "./request.ts";
import NexResponse from "./response.ts";

// const __filename = stdPath.fromFileUrl(import.meta.url);
// const __dirname = stdPath.dirname(stdPath.fromFileUrl(import.meta.url));

class MiddlewareRoute {
  private entryStaticFile = "index.html";

  protected serverStatic: string[] = [];

  protected handler: {
    path: string;
    listener: (req: NexRequest, res: NexResponse, next?: Function) => void;
    method: string;
  }[] = [];

  protected getMatchedRoute = (url: string, method: string) => {
    const methodMatchedRoute = this.handler
      .filter((c) =>
        String(c.method).toLocaleLowerCase() ===
          String(method).toLocaleLowerCase()
      );
    let params = {};
    const currPath = String(url).split("?")[0];

    let findHandler = methodMatchedRoute.find((c) => {
      const { path } = c;
      if (path === currPath) {
        return true;
      }

      const matchReg = pathToRegexp.match(path);
      const matchResult = matchReg(currPath);
      if (matchResult) {
        params = matchResult.params || {};
        return true;
      }

      return false;
    });

    if (!findHandler) {
      // check static file
      if (this.serverStatic && this.serverStatic.length) {
        findHandler = this.checkStaticFile(currPath);
      }
    }

    return { route: findHandler?.listener, params };
  };

  protected checkStaticFile = (f: string) => {
    for (let s of this.serverStatic) {
      try {
        // statSync will throw erro if no file exist
        let filePath = stdPath.join(s, f);
        if (!filePath.startsWith("http:") && !filePath.startsWith("https:")) {
          let fileInfo = Deno.statSync(filePath);

          if (!fileInfo) {
            continue;
          }

          if (fileInfo.isDirectory) {
            filePath = stdPath.join(filePath, this.entryStaticFile);
            fileInfo = Deno.statSync(filePath);
          }

          if (!fileInfo.isFile) {
            continue;
          }
        }

        return {
          listener: async (req: NexRequest, res: NexResponse) => {
            await res.sendFile(filePath);
          },
        };
      } catch (e) {
        // console.log(e);
      }
    }
    return {
      listener: async (req: NexRequest, res: NexResponse) => {
        res.send404();
      },
    } as any;
  };

  static = (path: string) => {
    // check is remote url
    if (path.startsWith("http:") || path.startsWith("https:")) {
      this.serverStatic.push(path);
    } else if (stdPath.isAbsolute(path)) {
      this.serverStatic.push(path);
    } else {
      // if this mod is running by deno run remote
      //   if (
      //     import.meta.url.startsWith("http:") ||
      //     import.meta.url.startsWith("https:")
      //   ) {
      //     // should keep static dir level same with call func file dir level
      //     // console.log(stdPath.join(stdPath.dirname(import.meta.url), path));
      //     this.serverStatic.push(
      //       stdPath.join(stdPath.dirname(import.meta.url), path),
      //     );
      //   } else {
      try {
        throw new Error();
        // aim to get call file path
      } catch (error) {
        // in win32 such as "at file:///......."
        const enrtyFileStack = error.stack.split("at ").map((c: string) =>
          c.trim()
        ).pop() as string;

        // in win32 such as file:///D:/xxx/xxx/a.ts:8:3
        const entryFileDir = stdPath.dirname(
          stdPath.fromFileUrl(enrtyFileStack.replace(/\:[0-9]+\:[0-9]+/, "")),
        );
        this.serverStatic.push(stdPath.join(entryFileDir, path));
      }
      //   }
    }

    return this;
  };

  get = () => {
    return this;
  };

  post = () => {
    return this;
  };

  patch = () => {
    return this;
  };

  delete = () => {
    return this;
  };

  put = () => {
    return this;
  };
}

export default MiddlewareRoute;
