# End-to-end testing of Chalk'it

## Setup

```sh
npm i
```

Either create a `.env` file or define environment variables to configure the tests. A the very least, `CHALKIT_DIR` must be set to point to a valid Chalk'it build.

## e2e testing

```sh
npm run test
```

Readable reports are generated with mochawesome. With the default setup, ouputs (logs, screenshots, etc.) are stored in `outputs`.

## Adding tests

Tests using reference dashboards and expected screenshots are defined in `dashboard-display.spec.ts`. Inputs are stored in `resources`.

Screenshots for dashboard `dashboard.xprjson` are named `dashboard-BROWSER.png`.

For new tests, run the tests once, check the screenshots in `outputs` and copy them to `resources`.

Also remember to format using prettier (`npm run prettier`).
