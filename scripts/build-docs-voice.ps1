# Bake action-synced narration INTO with-voice MP4s (single A/V file — not a separate track).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build-docs-voice.ps1
$ErrorActionPreference = "Stop"

$FeRoot = Split-Path $PSScriptRoot -Parent
$Videos = Join-Path $FeRoot "docs\videos"
$Walk = Join-Path $Videos "role-walkthroughs"
$SegRoot = Join-Path $Videos "voice-narration\segments"
$OutDir = Join-Path $Walk "with-voice"
New-Item -ItemType Directory -Force -Path $SegRoot, $OutDir | Out-Null

$EdgeTts = Join-Path $env:APPDATA "Python\Python314\Scripts\edge-tts.exe"
$Voice = if ($env:DOCS_VOICE) { $env:DOCS_VOICE } else { "en-US-JennyNeural" }
$UseEdge = Test-Path $EdgeTts

Add-Type -AssemblyName System.Speech
$synth = $null
if (-not $UseEdge) {
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $synth.Rate = -1
  $synth.Volume = 100
  try { $synth.SelectVoice("Microsoft Zira Desktop") } catch { }
  Write-Host "edge-tts not found — falling back to Windows SAPI"
} else {
  Write-Host "Using neural voice: $Voice"
}

function Speak-Wav([string]$Text, [string]$Path) {
  $dir = Split-Path $Path -Parent
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  if (Test-Path $Path) { Remove-Item $Path -Force }
  if ($UseEdge) {
    # edge-tts writes mp3; convert to 22050 mono wav for the mixer
    $mp3 = [IO.Path]::ChangeExtension($Path, ".mp3")
    if (Test-Path $mp3) { Remove-Item $mp3 -Force }
    & $EdgeTts --voice $Voice --text $Text --write-media $mp3
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $mp3)) { throw "edge-tts failed for: $Text" }
    & ffmpeg -y -i $mp3 -ac 1 -ar 22050 -c:a pcm_s16le $Path | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $Path)) { throw "mp3->wav failed: $mp3" }
    Remove-Item $mp3 -Force -ErrorAction SilentlyContinue
  } else {
    $synth.SetOutputToWaveFile($Path)
    $synth.Speak($Text)
    $synth.SetOutputToNull()
  }
}

function Get-WavDuration([string]$Path) {
  $raw = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Path
  return [double]$raw
}

function Get-VideoDuration([string]$Path) {
  $raw = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Path
  return [double]$raw
}

function Build-MuxedMp4 {
  param(
    [string]$Id,
    [string]$WebmName,
    [object[]]$Beats
  )
  $webm = Join-Path $Walk $WebmName
  if (-not (Test-Path $webm)) { throw "Missing video: $webm" }
  $vidDur = Get-VideoDuration $webm

  $segDir = Join-Path $SegRoot $Id
  New-Item -ItemType Directory -Force -Path $segDir | Out-Null
  Get-ChildItem $segDir -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $segDir | Out-Null

  # Speak all beats; shift start later if the previous line would overlap
  $cursor = 0.0
  $placed = @()
  $n = 0
  foreach ($b in $Beats) {
    $wav = Join-Path $segDir ("{0:D2}.wav" -f $n)
    Write-Host ("  TTS [{0} @{1}s] {2}..." -f $Id, $b.At, $b.Text.Substring(0, [Math]::Min(55, $b.Text.Length)))
    Speak-Wav $b.Text $wav
    $dur = Get-WavDuration $wav
    $start = [math]::Max([double]$b.At, $cursor)
    if ($start + $dur -gt $vidDur - 0.3) {
      # Fit inside video: allow slight overlap trim via -shortest later
      $start = [math]::Max(0, $vidDur - $dur - 0.2)
    }
    $placed += @{ Index = $n; Start = $start; Path = $wav; Dur = $dur }
    $cursor = $start + $dur + 0.35
    $n++
  }

  # Build one timeline WAV: silence bed + delayed clips mixed
  $bed = Join-Path $segDir "_bed.wav"
  & ffmpeg -y -f lavfi -i "anullsrc=r=22050:cl=mono" -t ("{0:0.000}" -f $vidDur) -c:a pcm_s16le $bed | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "failed to make silence bed for $Id" }

  $ffArgs = @("-y", "-i", $bed)
  $parts = New-Object System.Collections.Generic.List[string]
  $labels = New-Object System.Collections.Generic.List[string]
  $parts.Add("[0:a]volume=0[base]")
  $labels.Add("[base]")
  $ai = 1
  foreach ($p in $placed) {
    $ffArgs += @("-i", $p.Path)
    $delayMs = [int]([math]::Round($p.Start * 1000))
    # mono: single adelay value
    $parts.Add(("[{0}:a]adelay={1},apad[a{2}]" -f $ai, $delayMs, $p.Index))
    $labels.Add("[a$($p.Index)]")
    $ai++
  }
  $mixN = $labels.Count
  $fc = ($parts -join ";") + ";" + ($labels -join "") + "amix=inputs=${mixN}:dropout_transition=0:normalize=0:duration=first[aout]"

  $mixed = Join-Path $segDir "_mixed.wav"
  $ffArgs += @("-filter_complex", $fc, "-map", "[aout]", "-c:a", "pcm_s16le", $mixed)
  Write-Host "  Mix audio timeline ($n lines)..."
  & ffmpeg @ffArgs
  if ($LASTEXITCODE -ne 0) { throw "audio mix failed for $Id" }

  $mp4 = Join-Path $OutDir "$Id-demo.mp4"
  Write-Host "  Mux A+V -> $mp4"
  & ffmpeg -y -i $webm -i $mixed -map 0:v:0 -map 1:a:0 -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest $mp4
  if ($LASTEXITCODE -ne 0) { throw "final mux failed for $Id" }
  Write-Host "  OK $Id (voice baked into MP4)"
}

$requester = @(
  @{ At = 0.8; Text = "Requester GAC in Demo. On Submit Expense, only Admin-assigned projects appear for this persona." }
  @{ At = 8.0; Text = "Submit with an empty form. Required fields highlight — country, category, due date, amount, description, and invoice." }
  @{ At = 18.0; Text = "A text file is rejected. Invoices must be a PDF or an image." }
  @{ At = 26.0; Text = "Valid request. Country sets local currency. Amount is local — the server will convert to USD and store the FX rate. Project is one assigned to this requester." }
  @{ At = 40.0; Text = "Confirm submission, then Confirm and Submit." }
  @{ At = 46.0; Text = "Success with an Expense ID. Emails go to the requester and to approvers on this project. Click Dismiss — sticky notices stay until you close them." }
  @{ At = 56.0; Text = "Hard duplicate: the same invoice file again. Exact file match is blocked. Nothing is created. Dismiss." }
  @{ At = 68.0; Text = "Soft duplicate: a brand-new file and invoice number, but the same project, category, amount, and day." }
  @{ At = 78.0; Text = "Potential Duplicate Detected. Confirm it is a separate expense, then Confirm and Submit Expense." }
  @{ At = 90.0; Text = "Submitted after soft confirm. Dismiss." }
  @{ At = 100.0; Text = "My Requests tracks every status. Open View to see local amount, USD, and the FX rate. Then sign out." }
)

$approver = @(
  @{ At = 0.5; Text = "Approver Media in Demo. The Approver Panel lists only expenses for assigned projects." }
  @{ At = 5.0; Text = "Approve with optional notes, then Confirm. Processors are emailed. The requester sees Approved - Awaiting Processing in the app." }
  @{ At = 14.0; Text = "Request Changes — explain what to fix, then Send. The requester gets email and can Edit." }
  @{ At = 22.0; Text = "Reject with a clear reason. The requester is emailed." }
  @{ At = 30.0; Text = "Analytics — Export Excel Report. Then sign out." }
)

$processor = @(
  @{ At = 0.4; Text = "Processor Alisha in Demo." }
  @{ At = 3.0; Text = "Mark Paid — attach receipt, note, Confirm. Full payment recorded." }
  @{ At = 9.0; Text = "Partially Paid — amount now, receipt, Record Partial Payment." }
  @{ At = 13.0; Text = "Request Changes back, or Reject Payout if finance will not pay." }
  @{ At = 16.0; Text = "Sign out. Next is Admin." }
)

$admin = @(
  @{ At = 0.5; Text = "Admin opens the Demo workspace." }
  @{ At = 4.0; Text = "Projects — Add Project and create a training project." }
  @{ At = 10.0; Text = "Edit the name, save, then delete so Demo stays clean." }
  @{ At = 18.0; Text = "Categories — create, edit, then delete." }
  @{ At = 30.0; Text = "Countries — create with a unique currency, search, edit, delete." }
  @{ At = 45.0; Text = "User Management — add a Demo Access user with role and project." }
  @{ At = 55.0; Text = "Edit the user, save, then delete." }
  @{ At = 62.0; Text = "Peek at Approver and Processor, then sign out." }
)

Write-Host "=== Baking action-synced voice into MP4s (not separate) ==="
Build-MuxedMp4 -Id "01-requester" -WebmName "01-requester-demo.webm" -Beats $requester
Build-MuxedMp4 -Id "02-approver" -WebmName "02-approver-demo.webm" -Beats $approver
Build-MuxedMp4 -Id "03-processor" -WebmName "03-processor-demo.webm" -Beats $processor
Build-MuxedMp4 -Id "04-admin" -WebmName "04-admin-demo.webm" -Beats $admin

if ($synth) { $synth.Dispose() }
Write-Host "=== Done ==="
Get-ChildItem $OutDir -Filter "*-demo.mp4" | Format-Table Name, @{N='MB';E={[math]::Round($_.Length/1MB,2)}}
