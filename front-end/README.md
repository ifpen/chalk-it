# Chalk'it frontend

## Requirements

First, you need to have Node.js installed on your system. Please visit [http://nodejs.org](http://nodejs.org) for more information.

You might need to configure npm proxy before start.

Now you should be able to install any package!

### Bower

```sh
npm install -g bower
```

You might need to have administrator privileges before the command.

### Saas

```sh
npm install -g sass
```

## Installation

```sh
bower install
npm install

```

This will install necessary Node.js packages needed by the app, and also dependencies for Gulp tasks.

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
