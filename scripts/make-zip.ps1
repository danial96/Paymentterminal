$src = "C:\xampp\htdocs\softcube-crm"
$out = "C:\Users\$env:USERNAME\Desktop\softcube-crm.zip"

$exclude = @('.next', 'node_modules', '.git', 'scripts\make-zip.ps1')

if (Test-Path $out) { Remove-Item $out }

Add-Type -Assembly 'System.IO.Compression.FileSystem'
$zip = [System.IO.Compression.ZipFile]::Open($out, 'Create')

Get-ChildItem -Path $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1)
    $skip = $false
    foreach ($ex in $exclude) {
        if ($rel.StartsWith($ex)) { $skip = $true; break }
    }
    if (-not $skip) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel) | Out-Null
    }
}

$zip.Dispose()
Write-Host "Done: $out"
