$a = cat .\logs-1.log

$a | % {
    $m = $_ | sls -pattern "^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"
    $dateAsStr = $m.Matches.Groups[1].Value
    $u =[System.DateTimeOffset]::Parse($dateAsStr, $null, [System.Globalization.DateTimeStyles]::AssumeUniversal)
    $l = $u.ToLocalTime().ToString()
    $_ -replace $dateAsStr, $l
}
