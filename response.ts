import { Response, mime, path as stdPath } from "./deps.ts";

interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  overwrite?: boolean;
  path?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none" | boolean;
  signed?: boolean;
}

export default class NexResponse {
  private respond: (r: Response) => Promise<void>;

  private code: number = 200;

  private contentType: string = "";

  private cookies: string[] = [];

  constructor(respond: (r: Response) => Promise<void>) {
    this.respond = respond;
  }

  status = (code: number) => {
    this.code = code;
    return this;
  };

  type = (type: string) => {
    this.contentType = type;
    return this;
  };

  cookie = (key: string, value: string, options?: CookieOptions) => {
    this.cookies.push(
      [
        `${key}=${value}`,
        ...Object.keys(options || {}).map((k: any) => {
          const v = (options as any)[k];
          return `${k}=${String(v)}`;
        }),
      ].join(";"),
    );

    return this;
  };

  send = (data: any) => {
    let body = data;
    if (typeof data === "object") {
      body = JSON.stringify(data);
    } else {
      body = String(data);
    }

    const header = new Headers();
    if (this.contentType) {
      header.set("Content-Type", this.contentType);
    }
    header.set("Access-Control-Allow-Origin", "*");
    header.set(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Range",
    );

    this.cookies.forEach((c) => {
      header.append("Set-Cookie", c);
    });

    this.respond({
      body: body,
      status: this.code,
      headers: header,
    });
  };

  redirect = (url: string, redirectType: 301 | 302 = 301) => {
    const header = new Headers();
    header.set("Location", url);
    if (this.contentType) {
      header.set("Content-Type", this.contentType);
    }

    this.respond({
      status: redirectType,
      headers: header,
    });

    return this;
  };
  sendFile = async (f: any) => {
    if (f.startsWith("http:") || f.startsWith("https:")) {
      if (f.indexOf(".html") > 0) {
        // html file should fetch open
        const htmlContent = await fetch(f).then((s) => s.text());
        const header = new Headers();
        header.set("Status", "200");
        header.set("Content-Type", "text/html");

        this.respond({
          headers: header,
          status: 200,
          body: htmlContent,
        });

        return this;
      }

      return this.redirect(f, 302);
    }

    const header = new Headers();
    header.set("Access-Control-Allow-Origin", "*");
    if (this.contentType) {
      header.set("Content-Type", this.contentType);
    } else {
      header.set("Content-Type", mime.getType(stdPath.extname(f)));
    }
    header.set("Status", "200");
    header.set(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Range",
    );

    this.cookies.forEach((c) => {
      header.append("Set-Cookie", c);
    });

    const file = await Deno.open(f);

    this.respond({
      body: file,
      headers: header,
      status: 200,
    });
    return this;
  };

  send404 = () => {
    this.respond({
      status: 404,
      body: "404 not found",
    });
  };

  send500 = (error: Error) => {
    const header = new Headers();
    header.set("Content-Type", "text/plain; charset=UTF-8");
    this.respond({
      status: 500,
      body: error.message,
      headers: header,
    });
  };
}
