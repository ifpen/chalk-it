import express, { Express, Request, Response } from 'express';
import getPort from 'get-port';
import { Server } from 'http';
import { promisify } from 'util';
import { once } from 'events';
import { PathLike } from 'node:fs';
import { stringify } from 'qs';
import path from 'node:path';
import { createModuleLogger } from '../logging.js';

const logger = createModuleLogger('basic-server');

type ChalkitServerConfig = {
  staticDir?: string;
  port?: number;

  dashboardsUrlPath?: string;
};

// TODO should be json, but currently not well handled by the front end
const mime_type = 'text/plain';
//const mime_type = 'application/json';

export class ChalkitServer {
  public readonly app: Express;
  private server?: Server;
  private _port?: number;

  private dashboardContent: { [id: string]: string } = {};
  private dashboardFiles: { [id: string]: PathLike } = {};

  constructor(private readonly serverConf: ChalkitServerConfig) {
    this.app = express();
    if (serverConf.staticDir) {
      logger.debug(`Serving static content from ${serverConf.staticDir}`);
      this.app.use('/', express.static(serverConf.staticDir));
    }
    this.app.get(`/${this.dashboardsRoot}/:id`, this.getDashboard.bind(this));

    this.app.post('/api/ReadSettings', this.readSettings.bind(this));
  }

  public get port(): number {
    if (!this._port) {
      throw new Error('No port. Server not started?');
    }
    return this._port;
  }

  public get dashboardsRoot(): string {
    return this.serverConf.dashboardsUrlPath ?? '_dashboards';
  }

  private getDashboard(req: Request, res: Response) {
    const id = req.params.id;
    if (id in this.dashboardContent) {
      logger.debug(`Serving dashboard ${id} from memory`);
      res.setHeader('Content-Type', mime_type);
      res.send(this.dashboardContent[id]);
    } else if (id in this.dashboardFiles) {
      const file = this.dashboardFiles[id].toString();
      logger.debug(`Serving dashboard ${id} from file ${file}`);
      res.sendFile(file, { headers: { 'Content-Type': mime_type } });
    } else {
      logger.warn(`Dashboard ${id} not found`);
      res.sendStatus(404);
    }
  }

  private readSettings(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/json');

    const payload = {
      data: {},
      projects: [],
      dataNode: [],
      tags: [],
      updatedAt: '',
      createdAt: '',
      scope: {},
      info: {},
      settings: {},
      profile: {
        userName: 'Guest',
        Id: '-1',
      },
      help: {
        isDiscoverDone: false,
        displayHelp: true,
        discoverSteps: [0, 0, 0, 0, 0],
      },
    };

    const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    res.end(
      JSON.stringify({
        d: JSON.stringify({
          Success: true,
          Msg: null,
          Offset: 0,
          NbBytes: b64Payload.length,
          LastChunk: true,
          ReadOnly: false,
          FileData: b64Payload,
          Array: null,
        }),
      }),
    );
  }

  public async start(): Promise<void> {
    this._port = this.serverConf.port ?? (await getPort());

    this.server = this.app.listen(this.port);
    await once(this.server, 'listening');

    logger.info(`Stopped server on port ${this._port}`);
  }

  public async stop() {
    if (this.server) {
      const close = promisify(this.server.close.bind(this.server));
      await close();
      logger.info(`Started server ${this.getRootUrl()}`);
    }
  }

  public getRootUrl(): string {
    return `http://localhost:${this.port}`;
  }

  public getDashboardUrl(id: string): string {
    const params = stringify({ projectUrl: `${this.dashboardsRoot}/${id}` });
    return `${this.getRootUrl()}/?${params}`;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private checkId(id: string): void {
    if (id in this.dashboardContent || id in this.dashboardFiles) {
      throw new Error(`Id already in use: ${id}`);
    }
  }

  public registerDashboard(dashboard: string, id?: string): string {
    id ??= this.generateId();
    this.checkId(id);
    this.dashboardContent[id] = dashboard;
    return id;
  }

  public registerDashboardFile(dashboardFile: string, id?: string): string {
    id ??= this.generateId();
    this.checkId(id);
    this.dashboardFiles[id] = path.resolve(dashboardFile);
    return id;
  }
}
