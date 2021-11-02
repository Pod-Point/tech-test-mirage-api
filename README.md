# Tech Test Mirage API

![run-tests](https://github.com/Pod-Point/tech-test-mirage-api/actions/workflows/run-tests.yml/badge.svg)

This package provides a [MirageJS](https://miragejs.com/) API for use in mobile and front-end tech tests.

## Installation

```
npm install --save @pod-point/tech-test-mirage-api
```

## Usage

Import `createServer` and call from the root of your application.

### React

Example:

```javascript
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { createServer } from "@pod-point/tech-test-mirage-api";

if (process.env.NODE_ENV === "development") {
  createServer();
}

ReactDOM.render(<App />, document.getElementById("root"));
```

See the [Mirage docs](https://miragejs.com/quickstarts/react/develop-an-app/#step-3-start-your-server-in-development) for more information.

### React Native

Example:

```javascript
import React from "react"
import { createServer } from "@pod-point/tech-test-mirage-api"

if (window.server) {
  server.shutdown()
}

window.server = createServer();

export default function App() {
  [...]
}
```

See the [Mirage docs](https://miragejs.com/quickstarts/react-native/development/#step-2-create-a-server-alongside-your-networking-code) for more information.

## Development

### Formatting

Code formatting is provided via [Prettier](https://prettier.io/) and can code can automatically be formatted using:

```
npm run prettier
```

### Tests

Jest tests can be run as follows:

```
npm run test
```

### Publishing

To publish a new version of the package on NPM:

- Run `npm version` to bump the version number and tag a new version:

```
npm version <major|minor|patch>
```

- Push the new version:

```
git push --follow-tags
```

- Create a release on GitHub using the new tag. The `npm-publish` workflow will automatically publish this to NPM.
