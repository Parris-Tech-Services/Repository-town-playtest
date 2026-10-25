# PowerShell script: install-node-portable.ps1
# Downloads and extracts the latest Node.js LTS portable zip, sets up PATH for current session, and runs npm install

param(
    [string]$NodeDir = "portable-node",
    [string]$ProjectDir = (Get-Location)
)

Write-Host "Fetching latest Node.js LTS version info..."
$index = Invoke-RestMethod 'https://nodejs.org/dist/index.json'
$latestLTS = $index | Where-Object { $_.lts -ne $null } | Select-Object -First 1
$version = $latestLTS.version
$zipName = "node-$version-win-x64.zip"
$downloadUrl = "https://nodejs.org/dist/$version/$zipName"

Write-Host "Downloading $downloadUrl ..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipName

Write-Host "Extracting Node.js to $NodeDir ..."
Expand-Archive -Path $zipName -DestinationPath $NodeDir -Force

# Remove zip after extraction
Remove-Item $zipName -Force

# Set up PATH for current session
$nodeBin = Join-Path $NodeDir "node-$version-win-x64"
$env:PATH = "$nodeBin;$env:PATH"
Write-Host "Added $nodeBin to PATH for this session."

# Show Node and npm versions
Write-Host "Node version:"
& "$nodeBin\node.exe" -v
Write-Host "npm version:"
& "$nodeBin\npm.cmd" -v

# Run npm install in project directory
Write-Host "Running npm install in $ProjectDir ..."
Push-Location $ProjectDir
& "$nodeBin\npm.cmd" install
Pop-Location

Write-Host "Done. You can now run npm commands in this session."
Write-Host "To start the dev server:"
Write-Host "    & '$nodeBin\npm.cmd' run dev"
