$ErrorActionPreference = 'Stop'
$items = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../assets-sources.json') -Raw | ConvertFrom-Json
$outputDirectory = Join-Path $PSScriptRoot '../assets-originals'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
foreach ($item in $items) {
  $outputPath = Join-Path $outputDirectory ($item.name + '.jpg')
  & curl.exe -sS -L --fail --max-time 25 -o $outputPath $item.url
  if ($LASTEXITCODE -ne 0) { Write-Output ('Download falhou: ' + $item.name) } else { Write-Output ('Baixada: ' + $item.name) }
}
