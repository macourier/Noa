#!/usr/bin/env pwsh

[CmdletBinding()]
param(
  [string]$TargetDirectory = ".",
  [ValidateSet("beginner", "balanced", "strict")]
  [string]$Profile,
  [string]$Stack,
  [string]$Blueprint,
  [ValidateSet("true", "false")]
  [string]$Ci,
  [switch]$Newbie,
  [string]$RepositoryUrl = "https://github.com/fatidaprilian/Agentic-Senior-Core.git",
  [string[]]$AdditionalArguments
)

$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath {
  param([string]$PathValue)

  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    throw "TargetDirectory cannot be empty."
  }

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }

  $combinedPath = Join-Path -Path (Get-Location) -ChildPath $PathValue
  return [System.IO.Path]::GetFullPath($combinedPath)
}

function New-TemporaryDirectory {
  $temporaryDirectoryName = "agentic-senior-core-bootstrap-$(Get-Date -Format 'yyyyMMddHHmmssfff')"
  $temporaryDirectoryPath = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath $temporaryDirectoryName
  New-Item -ItemType Directory -Path $temporaryDirectoryPath | Out-Null
  return $temporaryDirectoryPath
}

$targetDirectoryPath = Resolve-AbsolutePath -PathValue $TargetDirectory
if (-not (Test-Path -Path $targetDirectoryPath -PathType Container)) {
  throw "Target directory does not exist: $targetDirectoryPath"
}

$temporaryRootDirectoryPath = New-TemporaryDirectory
$bootstrapRepositoryPath = Join-Path -Path $temporaryRootDirectoryPath -ChildPath "Agentic-Senior-Core"

try {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is required but was not found in PATH."
  }

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is required but was not found in PATH."
  }

  Write-Host "[Agentic-Senior-Core] Cloning bootstrap repository into temporary directory..."
  & git clone --depth 1 $RepositoryUrl $bootstrapRepositoryPath | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to clone repository from $RepositoryUrl"
  }

  $cliScriptPath = Join-Path -Path $bootstrapRepositoryPath -ChildPath "bin\agentic-senior-core.js"
  if (-not (Test-Path -Path $cliScriptPath -PathType Leaf)) {
    throw "CLI entry file not found: $cliScriptPath"
  }

  $cliArguments = @($cliScriptPath, "init", $targetDirectoryPath)

  if ($Profile) {
    $cliArguments += @("--profile", $Profile)
  }

  if ($Stack) {
    $cliArguments += @("--stack", $Stack)
  }

  if ($Blueprint) {
    $cliArguments += @("--blueprint", $Blueprint)
  }

  if ($Ci) {
    $cliArguments += @("--ci", $Ci)
  }

  if ($Newbie.IsPresent) {
    $cliArguments += "--newbie"
  }

  if ($AdditionalArguments) {
    $cliArguments += $AdditionalArguments
  }

  Write-Host "[Agentic-Senior-Core] Running CLI against target directory: $targetDirectoryPath"
  & node @cliArguments
  if ($LASTEXITCODE -ne 0) {
    throw "CLI exited with a non-zero status code: $LASTEXITCODE"
  }
}
finally {
  if (Test-Path -Path $temporaryRootDirectoryPath) {
    Remove-Item -Path $temporaryRootDirectoryPath -Recurse -Force
  }
}