# Chalk'it Development Instructions

Chalk'it is a web-based dashboard creation platform that combines a Node.js/Angular front-end with a Python Flask back-end. It allows users to create interactive dashboards using Python and JavaScript code.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Initial Setup (Required for fresh clone)
Run these commands in order to set up the development environment:

```bash
# Install Python dependencies - takes ~15 seconds
pip install -r requirements.txt

# Install front-end dependencies - takes ~60 seconds, NEVER CANCEL
cd front-end
npm install
cd ..
```

### Build Commands
**CRITICAL**: All build operations take significant time. NEVER CANCEL these commands.

```bash
# Front-end development build - takes ~30 seconds, NEVER CANCEL, timeout: 120+ seconds
cd front-end
npm run build:dev

# Front-end production build - takes ~35 seconds, NEVER CANCEL, timeout: 120+ seconds  
npm run build:prod

# Full pip package build - takes ~45 seconds, NEVER CANCEL, timeout: 180+ seconds
cd ..
python build.py --buildtype pip

# Full hosted web application build - takes ~45 seconds, NEVER CANCEL, timeout: 180+ seconds
python build.py --buildtype hosted
```

### Development Server
Start the complete development environment:

```bash
# Start both front-end dev server and Flask backend - takes ~25 seconds to fully start
cd front-end
npm start
```

This starts:
- Webpack dev server on http://localhost:7854/ (front-end)
- Flask backend on http://127.0.0.1:5000/ (API server)
- Automatic proxy between front-end and back-end

### Linting and Code Quality
```bash
# Check code formatting - takes ~7 seconds
cd front-end
npm run lint:prettier

# Fix code formatting - takes ~10 seconds
npm run lint:fix:prettier

# Run ESLint - takes ~4 seconds (expect many existing warnings/errors)
npm run lint:eslint
```

## Validation

### Manual Testing Requirements
ALWAYS perform these validation steps after making changes:

1. **Build Validation**: Run the appropriate build command and verify it completes without errors
2. **Development Server Test**: Start the dev server with `npm start` and verify both services start
3. **Browser Access**: Navigate to http://localhost:7854/ and verify the application loads
4. **Basic Functionality**: Create a simple dashboard to ensure core functionality works

### End-to-End Testing
```bash
# Set up e2e tests - takes ~5 seconds
cd e2e
npm install

# Build e2e tests - takes ~3 seconds
npm run pre-test-build

# Note: Full e2e tests require Chrome and take significant time
# Only run when specifically testing UI changes
```

### Backend Testing
```bash
# Backend middleware tests (may have network issues)
cd back_end/middleware
pip install hatch
hatch run test:run-coverage
```

## Critical Timing and Timeout Information

**NEVER CANCEL** any of these operations before the specified time:

| Operation | Expected Time | Minimum Timeout |
|-----------|---------------|-----------------|
| `pip install -r requirements.txt` | 15 seconds | 60 seconds |
| `npm install` (front-end) | 60 seconds | 300 seconds |
| `npm run build:dev` | 30 seconds | 120 seconds |
| `npm run build:prod` | 35 seconds | 120 seconds |
| `python build.py --buildtype pip` | 45 seconds | 180 seconds |
| `npm start` (dev server startup) | 25 seconds | 120 seconds |

## Project Structure

### Key Directories
- `front-end/` - Angular/Node.js web application
- `back_end/app/` - Main Flask application server
- `back_end/middleware/` - Python API middleware
- `back_end/render/` - Dashboard rendering components
- `documentation/` - MkDocs documentation
- `e2e/` - End-to-end tests using Selenium
- `build/` - Build output directory (created during build)

### Important Files
- `build.py` - Main build orchestration script
- `main.py` - Flask application entry point
- `front-end/package.json` - Front-end dependencies and scripts
- `requirements.txt` - Python dependencies
- `version.json` - Version configuration

## Common Development Tasks

### Making Front-end Changes
1. Start development server: `cd front-end && npm start`
2. Make code changes in `front-end/source/`
3. Changes auto-reload in browser (webpack hot reload)
4. Before committing: run `npm run lint:fix:prettier`

### Making Back-end Changes  
1. Start development server: `cd front-end && npm start` (starts both front and backend)
2. Make changes in `back_end/app/` or other backend directories
3. Restart server to see changes (Ctrl+C then `npm start` again)
4. Test API endpoints through the front-end interface

### Building for Production
```bash
# For pip package distribution
python build.py --buildtype pip
# Output: build/dist/py-chalk-it-*.tar.gz

# For static web hosting
python build.py --buildtype hosted  
# Output: front-end/build/ directory
```

### Testing Changes
1. **Always** run the build process appropriate for your changes
2. **Always** start the development server and test basic functionality
3. For front-end changes: verify the UI loads and basic interactions work
4. For back-end changes: test API functionality through the UI
5. Run linting tools before committing: `npm run lint:fix:prettier`

## Known Issues and Workarounds

### Front-end Tests
- Unit tests have webpack configuration issues and currently fail
- Infrastructure exists but needs configuration fixes
- Focus on manual testing and e2e tests for validation

### ESLint Warnings
- Many existing ESLint warnings/errors in the codebase
- These are not related to new changes - only fix if specifically related to your modifications
- Run `npm run lint:eslint` to see current status

### Backend Tests
- Middleware tests may timeout due to network issues with PyPI
- Tests exist but may not run reliably in all environments
- Focus on manual testing of backend functionality

## Environment Variables and Configuration

### Front-end Configuration
- `.env.dev` - Development environment settings
- `.env.prod.pip` - Production settings for pip builds
- `.env.prod.hosted` - Production settings for hosted builds
- Configuration automatically selected based on build type

### Development URLs
- Front-end dev server: http://localhost:7854/
- Backend API server: http://127.0.0.1:5000/
- Documentation (after build): Built in documentation/site/

## File System Locations

### Build Outputs
```
build/dist/           # Pip package output
front-end/build/      # Static web application output  
documentation/site/   # Built documentation
```

### Source Code Organization
```
front-end/source/     # Angular application source
back_end/app/         # Flask application
back_end/middleware/  # Python middleware API
back_end/common/      # Shared backend utilities
```

This instruction set provides the essential knowledge needed to work effectively with the Chalk'it codebase. Always validate changes with the build process and manual testing before committing.