# Copy Playwright walkthrough videos into docs/videos/role-walkthroughs/
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'test-results\docs-walkthroughs'
$dest = Join-Path $root 'docs\videos\role-walkthroughs'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

if (-not (Test-Path $src)) {
  Write-Error "No recordings at $src — run: npm run test:e2e:docs"
}

$map = @(
  @{ Match = 'Requester-Demo'; Out = '01-requester-demo.webm' },
  @{ Match = 'Approver-Demo'; Out = '02-approver-demo.webm' },
  @{ Match = 'Processor-Demo'; Out = '03-processor-demo.webm' },
  @{ Match = 'Admin-Demo'; Out = '04-admin-demo.webm' }
)

$copied = 0
Get-ChildItem -Path $src -Recurse -Filter 'video.webm' | ForEach-Object {
  $folder = $_.Directory.Name
  foreach ($m in $map) {
    if ($folder -match $m.Match) {
      $target = Join-Path $dest $m.Out
      Copy-Item -Force $_.FullName $target
      Write-Host "Copied $($m.Out) ($([math]::Round($_.Length/1MB, 1)) MB)"
      $copied++
      break
    }
  }
}

if ($copied -lt 4) {
  Write-Warning "Expected 4 videos, copied $copied. Check test-results\docs-walkthroughs"
} else {
  Write-Host "OK — $copied videos in $dest"
  Write-Host "Bake timed voice into MP4s: powershell -File scripts/build-docs-voice.ps1"
  Write-Host "Then upload: npm run docs:upload-videos"
}
