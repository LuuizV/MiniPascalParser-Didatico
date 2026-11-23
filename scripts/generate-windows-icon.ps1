# Gera o ICO multirresolucao a partir do PNG do MiniPascal sem dependencias externas.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$png = Join-Path $root 'assets/minipascal.png'
$ico = Join-Path $root 'assets/minipascal.ico'
if (!(Test-Path $png)) { throw "PNG ausente: $png" }
$source = [System.Drawing.Image]::FromFile($png)
try {
  $sizes = @(16,24,32,48,64,128,256)
  $payloads = @()
  foreach ($size in $sizes) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($source, 0, 0, $size, $size)
      } finally { $graphics.Dispose() }
      $memory = [System.IO.MemoryStream]::new()
      try {
        $bitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)
        $payloads += ,($memory.ToArray())
      } finally { $memory.Dispose() }
    } finally { $bitmap.Dispose() }
  }
  $result = [System.IO.MemoryStream]::new()
  try {
    $writer = [System.IO.BinaryWriter]::new($result)
    $writer.Write([uint16]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]$sizes.Count)
    $offset = 6 + 16 * $sizes.Count
    for ($i = 0; $i -lt $sizes.Count; $i++) {
      $dimension = if ($sizes[$i] -eq 256) { [byte]0 } else { [byte]$sizes[$i] }
      $writer.Write($dimension)
      $writer.Write($dimension)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([uint16]1)
      $writer.Write([uint16]32)
      $writer.Write([uint32]$payloads[$i].Length)
      $writer.Write([uint32]$offset)
      $offset += $payloads[$i].Length
    }
    foreach ($payload in $payloads) { $writer.Write([byte[]]$payload) }
    $writer.Flush()
    [System.IO.File]::WriteAllBytes($ico, $result.ToArray())
  } finally { $result.Dispose() }
  Write-Host "Icone Windows gerado com $($sizes.Count) resolucoes: $ico"
} finally { $source.Dispose() }
