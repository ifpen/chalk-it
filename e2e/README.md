# End-to-end testing of Chalk'it

## Setup

```sh
npm i
```

Either create a `.env` file or define environment variables to configure the tests. A the very least, `CHALKIT_DIR` must be set to point to a valid Chalk'it build.

## Environment Variables

### Required
- `CHALKIT_DIR` - Path to a valid Chalk'it build directory

### Optional
- `BROWSER_LIST` - Comma-separated list of browsers (default: chrome,edge)
- `HEADLESS` - Run browsers in headless mode (default: true)
- `WIDTH` - Browser window width (default: 1600)
- `HEIGHT` - Browser window height (default: 900)
- `OUTPUT_DIR` - Directory for test outputs (default: outputs)

### Visual Comparison Settings
- `VISUAL_THRESHOLD` - Pixel comparison sensitivity (default: 0.1, range: 0.0-1.0)
- `MAX_MISMATCHED_PIXELS` - Maximum allowed mismatched pixels (default: 2000)
- `MAX_MISMATCHED_PERCENTAGE` - Maximum allowed mismatch percentage (default: 1.0)

## e2e testing

```sh
npm run test
```

Readable reports are generated with mochawesome. With the default setup, ouputs (logs, screenshots, etc.) are stored in `outputs`.

## Visual Testing

The visual tests compare screenshots of rendered dashboards against reference images. To make tests robust against minor rendering differences between environments:

- **Threshold**: Controls pixel-level sensitivity (0.0 = exact match, 1.0 = very tolerant)
- **Max Mismatched Pixels**: Absolute limit on different pixels
- **Max Mismatched Percentage**: Percentage limit relative to image size

A test passes if BOTH the absolute pixel count AND percentage are within limits.

## Adding tests

Tests using reference dashboards and expected screenshots are defined in `dashboard-display.spec.ts`. Inputs are stored in `resources`.

Screenshots for dashboard `dashboard.xprjson` are named `dashboard-BROWSER.png`.

For new tests, run the tests once, check the screenshots in `outputs` and copy them to `resources`.

Also remember to format using prettier (`npm run prettier`).
