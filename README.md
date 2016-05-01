## ReactiveNotes

### Install

* Clone the repo
* Run `npm install`

### Changes

**0.3.2**

* Add flags for starring items
* Fix sorting
* Fix deploy

**0.3.0**

* Added todo lists and generic meta-data
* Added meta-data triggered display plugins

**0.1.1**

* Updating some nested dependencies and removing a stale dep we do not use

### Development
* Run `NODE_ENV=development gulp`
* Go to `localhost:8889` to display the app
* Go to `localhost:8889/testrunner.html` to see your tests
* Any changes to `app` or `styles` folder will automatically rebuild to `build` folder
* Both tests and application changes will refresh automatically in the browser
* Run `gulp test` to run all tests with phantomJS and produce XML reports

### Minify the code, ready for production
* Run `NODE_ENV=production gulp deploy`

### Directory
* **build/**: Where your automatically builds to. This is where you launch your app in development
* **dist/**: Where the deployed code exists, ready for production
* **styles/**: Where you put your css files
* **specs/**: Where you put your test files
* **gulpfile**: Gulp configuration
