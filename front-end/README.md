# Chalk'it frontend

## Requirements

First, you need to have Node.js installed on your system. Please visit [http://nodejs.org](http://nodejs.org) for more information.
Required version is v12.19.0.

You might need to configure npm proxy before start.

Now you should be able to install any package!
### Saas

```sh
npm install -g sass
```

## Installation


```sh
npm install -g gulp-cli
```

```sh
npm install
```

This will install necessary Node.js packages needed by the app, and also dependencies for Gulp tasks.

## Configuration

### Environment Variables

There is a `.env.sample` file that you can copy to `.env.dev` (for development) and `.env.prod` (for production &mdash; it will get renamed to `.env` when the app is built).

## Building

To create your development environment, run:

```sh
npm run start
```

To create distribution bundles for this app, run:

```sh
npm run build
```

A new directory named `build` by default (or you can set up the name in the .env file) containing build package is created.

To run the server ,run :<br>

- **Environment dev**

```sh
python server.py --dev
```

clear the cache

```sh
npm run clean:cache
```
