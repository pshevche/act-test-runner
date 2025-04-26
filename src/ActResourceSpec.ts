export class ActResourceSpec {
  readonly path: string;
  readonly host: string | undefined;
  readonly port: number | undefined;

  constructor(
    path: string,
    host: string | undefined,
    port: number | undefined,
  ) {
    this.path = path;
    this.host = host;
    this.port = port;
  }
}
