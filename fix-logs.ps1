$lines = Get-Content .\logs-1.log

$lines | ForEach-Object {
    $match = $_ | Select-String -pattern "^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"
    $dateAsStr = $match.Matches.Groups[1].Value
    $dateParsed =[System.DateTimeOffset]::Parse($dateAsStr, $null, [System.Globalization.DateTimeStyles]::AssumeUniversal)
    $dateLocal = $dateParsed.ToLocalTime().ToString()
    $_ -replace $dateAsStr, $dateLocal
}
