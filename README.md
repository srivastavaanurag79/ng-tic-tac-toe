# NgTicTacToe

Live: [Kattam Kutta](https://kattam-kutta.web.app/)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Session-based group games

The Tic Tac Toe (2-player), Ludo, and Uno modes support session-based group play inspired by the room/session model in [ghostwire](https://github.com/srivastavaanurag79/ghostwire) (room codes, host/join flow, transport abstraction). This app uses a lightweight game-state relay model (not Ghostwire's E2E mesh protocol).

- **Same browser/device tabs**: uses `BroadcastChannel` for local multi-tab testing.
- **Cross-device/network**: run `node session-relay.js [port]` on a host machine and connect clients to `ws://<host-ip>:8787`.
- Ludo and Uno are **quick/simplified** implementations with host-authoritative session state; Tic Tac Toe 2-player can be played locally or as a shared session.
