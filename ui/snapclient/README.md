# Snapclient

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.2.12.


## Configuration

Configuration required by the project does not happen through the standard Angular environments mechanism because it's not compatible with Continous Integration. The Angular way of storing configuration items in `src/environments/environment.ts` bundles the config within the application's main.js file so a CI server cannot simply replace the configuration items. 

Instead of this approach we feed the configuration from the backend server to the Angular app. This way shared configuration with the backend happens in one place and the CI server can set all required items via environment variables at build/release time.
The loading of the configuration happens before the application boots up so it's ready for the application even before the `APP_INITIALIZER` provider happens.

We have one static file that stores config items for the code that runs before the main configuration is loaded from the backend API. This file must contain the location of the backend API server. The static config file is [src/assets/config.json](src/assets/config.json) and it can be replaced by the CI server for different environments at build or release time.

To use the configuration items in your code you need to Inject the `APP_CONFIG` configuration object in the class constructor with the `@Inject()` parameter decorator:
```
export class Example {
  constructor(@Inject(APP_CONFIG) private config: AppConfig) {
    ...
  }
  ...
  private configItem = this.config.configItem;
  ...
}
```
In case you need to inject the configuration in a provider's factory function, set `APP_CONFIG` provider token with the `deps` property. Follow the Sentry setup example in [app.module.ts](src/app/app.module.ts).

### Adding new configuration items
A drawback of hosting the config through the API means you need to maintain your configuration items in two places. The Spring Boot backend API hosts the [UserInterfaceConfigurationDetails](../../api/src/main/java/org/snomed/snap2snomed/controller/dto/UserInterfaceConfigurationDetails.java) configuration DTO via the the Rest controller [UserInterfaceConfigurationRestController](../../api/src/main/java/org/snomed/snap2snomed/controller/UserInterfaceConfigurationRestController.java). You need to add your new configuration items here first. If need be, you may have to feed this new parameter to the API through the [Terraform deployment](../../terraform) if it is a new parameter the back end doesn't already have.
Then you need to modify the Angular app's [AppConfig](src/app/app.config.ts) configuration object and add the new type-safe item there.

## Development server

You have to set `API_BASE_URL` environment variable in your system or via a `.env` file in your Angular source's main directory. This variable holds the location of the API backend server. For development we usually host the backend at: `API_BASE_URL=http://localhost:8080`
After the environment variable is set up run `yarn start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Packaging

This project uses yarn to manage packaging.

Handy commands:
1. Update packages `yarn` or `yarn install`
2. Add specific package `yarn add <package>@<version>`
3. Remove specific package `yarn remove <package>@<version>`

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Translation / Internationalization

This application requires multi-lingual support which is provided by a package `ngx-translate`.  
See docs for how to use: https://github.com/ngx-translate/core

Translations are provided in json format and referred to by 'KEY.NAME' in the code.  These files are in `assets/i18n` eg `en.json`.

## NgRx store

This application uses the global state management of NgRx with actions, reducers, effects and selectors.  Documentation is here: https://ngrx.io/guide/store

## Browser refresh

Page refreshes for this application are managed by syncing the browser sessionStorage to the NgRx store and allowing it to restore itself.

## Token refresh

Authentication tokens are refreshed if a user is authenticated and then hits a 401 response from a request.  Currently the token expiry is 3600 secs.
