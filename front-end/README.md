# Chalk'it frontend

## Requirements

First, you need to have Node.js installed on your system. Please visit [http://nodejs.org](http://nodejs.org) for more information.
Required version is v12.19.0.

You might need to configure npm proxy before start.

Now you should be able to install any package!

## Installation

```sh
npm install
```

This will install necessary Node.js packages needed by the app.

## Configuration

### Environment Variables

There is a `.env.sample` file that you can copy to `.env.dev` (for development) and `.env.prod` (for production &mdash; it will get renamed to `.env` when the app is built).

## Building

To start the webpack server, run:

```sh
npm run start
```

To create distribution bundles for this app (this requires a working python environement for mkdoc), run:

```sh
npm run build
```

The build result goes into `build`.

To run the server ,run :<br>

- **Environment dev**

```sh
python server.py --dev
```

Clear all build artefacts

```sh
npm run build:clean
```
