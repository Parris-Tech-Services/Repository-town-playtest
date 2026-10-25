#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")"

# Initialize npm project
if [ ! -f package.json ]; then
  npm init -y
fi

# Install dependencies
npm install react react-dom
npm install --save-dev parcel

# Create index.html if not exists
if [ ! -f index.html ]; then
  cat <<EOL > index.html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Multi-Layer Zoom Game</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="./src/App.js" type="module"></script>
  </body>
</html>
EOL
fi

# Add start script to package.json if not present
if ! grep -q '"start":' package.json; then
  npx --yes json -I -f package.json -e 'this.scripts={...this.scripts,"start":"parcel index.html --open"}'
fi

# Run the dev server
npm start
