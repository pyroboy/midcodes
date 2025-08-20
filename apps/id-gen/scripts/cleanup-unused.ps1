$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Join-Path $root '..'
$project = (Resolve-Path $project).Path
$backup = Join-Path $project 'backup/unused-components'

Write-Host "Backing up to: $backup"
New-Item -ItemType Directory -Force -Path $backup | Out-Null

$paths = @(
  'src/lib/components/Card.svelte',
  'src/lib/components/LoadingSpinner.svelte',
  'src/lib/components/ui/accordion',
  'src/lib/components/ui/alert-dialog',
  'src/lib/components/ui/carousel',
  'src/lib/components/ui/chart',
  'src/lib/components/ui/hover-card'
)

foreach ($rel in $paths) {
  $src = Join-Path $project $rel
  if (Test-Path $src) {
    $leaf = Split-Path $src -Leaf
    $dest = Join-Path $backup $leaf
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    Write-Host "Backing up: $rel"
    Copy-Item -Recurse -Force $src $dest
  } else {
    Write-Host "Not found (skipping backup): $rel"
  }
}

foreach ($rel in $paths) {
  $src = Join-Path $project $rel
  if (Test-Path $src) {
    Write-Host "Removing: $rel"
    Remove-Item -Recurse -Force $src
  }
}

Write-Host "Cleanup complete."

