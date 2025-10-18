# Vehicle Rental System - React Frontend

This React application displays vehicles on an interactive map and integrates with the FleetService API through Azure API Management.

## 🏗️ Architecture

- **Development**: Connects directly to local FleetService API (`http://localhost:5000`)
- **Production**: Routes through Azure API Management (`https://vehicle-rental-apim.azure-api.net/fleet`)
- **No subscription keys required**: Simplified access configuration

## 🔧 Environment Configuration

### Development (`.env.development`)
```env
REACT_APP_API_URL=http://localhost:5000
```

### Production (`.env.production`)
```env
REACT_APP_API_URL=https://vehicle-rental-apim.azure-api.net/fleet
```

## 🚀 Prerequisites

1. **Development**: FleetService API running on `localhost:5000`
2. **Production**: Azure API Management deployed and configured

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

### `CI/CD`

in GitHub Actions:
- name: Upload to Azure Blob
  uses: azure/cli@v1
  with:
    inlineScript: |
      az storage blob upload-batch \
        --account-name ${{ secrets.AZURE_STORAGE_ACCOUNT }} \
        --destination '$web' \
        --source build \
        --overwrite


### `review`
https://adlsgen2vc.z13.web.core.windows.net/

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
