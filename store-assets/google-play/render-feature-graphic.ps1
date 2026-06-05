param(
  [string]$OutputPath = "store-assets/google-play/feature-graphic.png"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$width = 1024
$height = 500
$bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

function New-RoundRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $path
}

function Fill-RoundRect($brush, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-RoundRectPath $x $y $w $h $r
  $script:graphics.FillPath($brush, $path)
  $path.Dispose()
}

function Fill-Glow([float]$x, [float]$y, [float]$w, [float]$h, [int]$red, [int]$green, [int]$blue, [int]$alpha) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddEllipse($x, $y, $w, $h)
  $brush = [System.Drawing.Drawing2D.PathGradientBrush]::new($path)
  $brush.CenterColor = [System.Drawing.Color]::FromArgb($alpha, $red, $green, $blue)
  $brush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $red, $green, $blue))
  $script:graphics.FillEllipse($brush, $x, $y, $w, $h)
  $brush.Dispose()
  $path.Dispose()
}

function Draw-ModeCard([string]$path, [float]$x, [float]$y, [float]$angle) {
  $state = $script:graphics.Save()
  $script:graphics.TranslateTransform($x + 83, $y + 58)
  $script:graphics.RotateTransform($angle)
  $script:graphics.TranslateTransform(-83, -58)
  $image = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $path).Path)
  try {
    $script:graphics.DrawImage($image, 0, 0, 166, 116)
    $shade = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
      [System.Drawing.Rectangle]::new(0, 0, 166, 116),
      [System.Drawing.Color]::FromArgb(0, 0, 0, 0),
      [System.Drawing.Color]::FromArgb(76, 0, 0, 0),
      90
    )
    $script:graphics.FillRectangle($shade, 0, 0, 166, 116)
    $shade.Dispose()
    $border = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(72, 255, 255, 255), 2)
    $script:graphics.DrawRectangle($border, 1, 1, 164, 114)
    $border.Dispose()
  } finally {
    $image.Dispose()
    $script:graphics.Restore($state)
  }
}

function Draw-CenteredText([string]$text, $font, $brush, [float]$x, [float]$y, [float]$w, [float]$h) {
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $script:graphics.DrawString($text, $font, $brush, [System.Drawing.RectangleF]::new($x, $y, $w, $h), $format)
  $format.Dispose()
}

try {
  $rect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
  $background = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.Color]::FromArgb(16, 37, 47),
    [System.Drawing.Color]::FromArgb(41, 28, 49),
    135
  )
  $graphics.FillRectangle($background, $rect)
  $background.Dispose()

  Fill-Glow -x -120 -y -90 -w 520 -h 430 -red 38 -green 195 -blue 154 -alpha 120
  Fill-Glow -x 710 -y -85 -w 400 -h 320 -red 255 -green 192 -blue 73 -alpha 104
  Fill-Glow -x 610 -y 280 -w 430 -h 300 -red 64 -green 112 -blue 255 -alpha 96

  $overlay = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.Color]::FromArgb(112, 5, 9, 14),
    [System.Drawing.Color]::FromArgb(42, 5, 9, 14),
    0
  )
  $graphics.FillRectangle($overlay, $rect)
  $overlay.Dispose()

  $gridPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(36, 255, 255, 255), 1)
  for ($x = -120; $x -lt 1150; $x += 72) {
    $graphics.DrawLine($gridPen, $x, 0, $x + 360, 500)
  }
  for ($x = -260; $x -lt 1050; $x += 96) {
    $graphics.DrawLine($gridPen, $x, 500, $x + 420, 0)
  }
  $gridPen.Dispose()

  Draw-ModeCard "src/assets/modes/europe.png" 43 39 -10
  Draw-ModeCard "src/assets/modes/asia.png" 800 39 9
  Draw-ModeCard "src/assets/modes/africa.png" 91 348 8
  Draw-ModeCard "src/assets/modes/world.png" 775 349 -7

  $fontKicker = [System.Drawing.Font]::new("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
  $fontTitle = [System.Drawing.Font]::new("Arial", 82, [System.Drawing.FontStyle]::Bold)
  $fontSubhead = [System.Drawing.Font]::new("Segoe UI", 25, [System.Drawing.FontStyle]::Bold)
  $fontChip = [System.Drawing.Font]::new("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
  $fontAnswer = [System.Drawing.Font]::new("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
  $fontScore = [System.Drawing.Font]::new("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)

  $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $muted = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(214, 255, 255, 255))
  $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 192, 73))
  $green = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(38, 195, 154))
  $darkGreen = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(6, 24, 19))
  $badge = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(32, 255, 255, 255))

  Fill-RoundRect $badge 92 118 223 34 17
  $graphics.DrawString("FAST GEOGRAPHY QUIZ", $fontKicker, $muted, 107, 125)

  $shadow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(80, 0, 0, 0))
  $graphics.DrawString("Flag", $fontTitle, $shadow, 95, 174)
  $graphics.DrawString("Rush", $fontTitle, $shadow, 357, 174)
  $graphics.DrawString("Flag", $fontTitle, $white, 92, 168)
  $graphics.DrawString("Rush", $fontTitle, $gold, 354, 168)
  $shadow.Dispose()

  $graphics.DrawString("Guess flags, build streaks,`nand master every region.", $fontSubhead, $muted, 94, 264)

  Fill-RoundRect $green 92 342 138 42 14
  Draw-CenteredText "Blitz rounds" $fontChip $darkGreen 92 342 138 42

  $chipBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(36, 255, 255, 255))
  Fill-RoundRect $chipBrush 242 342 126 42 14
  Draw-CenteredText "Ranks & XP" $fontChip $white 242 342 126 42
  Fill-RoundRect $chipBrush 380 342 150 42 14
  Draw-CenteredText "Country facts" $fontChip $white 380 342 150 42
  $chipBrush.Dispose()

  $state = $graphics.Save()
  $graphics.TranslateTransform(820, 244)
  $graphics.RotateTransform(4)
  $graphics.TranslateTransform(-126, -143)

  $card = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210, 17, 24, 39))
  Fill-RoundRect $card 0 0 252 286 26
  $flagBlue = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(0, 91, 187))
  $flagYellow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 213, 0))
  Fill-RoundRect $flagBlue 24 24 204 62 18
  Fill-RoundRect $flagYellow 24 80 204 62 18
  $graphics.DrawString("GUESS THE FLAG", $fontKicker, $muted, 24, 161)
  $answerBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(247, 190, 63))
  Fill-RoundRect $answerBrush 24 194 204 44 14
  $darkAnswer = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(22, 18, 10))
  Draw-CenteredText "Ukraine" $fontAnswer $darkAnswer 24 194 204 44
  $graphics.DrawString("Streak x8", $fontScore, $muted, 24, 254)
  $graphics.DrawString("+120 XP", $fontScore, $muted, 166, 254)
  $graphics.Restore($state)

  $spark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(220, 255, 255, 255))
  $graphics.FillEllipse($spark, 690, 82, 10, 10)
  $graphics.FillEllipse($spark, 840, 250, 7, 7)
  $graphics.FillEllipse($spark, 520, 407, 8, 8)

  $resolvedOutput = Join-Path (Resolve-Path -LiteralPath ".").Path $OutputPath
  $outputDir = Split-Path -Parent $resolvedOutput
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
  $tmp = "$resolvedOutput.tmp.png"
  $bitmap.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  Move-Item -LiteralPath $tmp -Destination $resolvedOutput -Force
} finally {
  foreach ($item in @($fontKicker, $fontTitle, $fontSubhead, $fontChip, $fontAnswer, $fontScore, $white, $muted, $gold, $green, $darkGreen, $badge, $card, $flagBlue, $flagYellow, $answerBrush, $darkAnswer, $spark)) {
    if ($null -ne $item) { $item.Dispose() }
  }
  $graphics.Dispose()
  $bitmap.Dispose()
}

$image = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $OutputPath).Path)
try {
  [pscustomobject]@{
    Path = $OutputPath
    Width = $image.Width
    Height = $image.Height
    PixelFormat = $image.PixelFormat
    Bytes = (Get-Item -LiteralPath $OutputPath).Length
  }
} finally {
  $image.Dispose()
}
