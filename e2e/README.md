# End-to-end testing of Chalk'it

## Setup

```sh
npm i
```

## First-use

Generate reference screenshots and logs for targeted tests from Chalk'it template library into `reference-png` directory

```sh
node test-templates.js --reference
```

## e2e testing

```sh
node test-templates.js --test
node compare-results.js
```