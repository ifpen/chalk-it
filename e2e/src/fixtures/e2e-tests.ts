import { config } from '../test-config.js';
import { ChalkitServer } from '../support/basic-server.js';

export function describeWithServer(title: string, testSuite: (server: ChalkitServer) => void): void {
  describe(title, function () {
    const server = new ChalkitServer({
      staticDir: config.chalkitDir,
    });
    before(async () => {
      await server.start();
    });
    after(async () => {
      await server.stop();
    });

    testSuite(server);
  });
}
