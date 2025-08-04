function Remove-TerminalControlCharacters {
    [CmdletBinding()]
    param (
        [Parameter(ValueFromPipeline = $true, Mandatory = $true)]
        [string]$Line
    )
    process {
        $Line -replace '\x1b\[[0-9;]*m|\x1b\(B',''
    }
}

function Update-TimeZone {
    [CmdletBinding()]
    param (
        [Parameter(ValueFromPipeline = $true, Mandatory = $true)]
        [string]$Line
    )
    process {
        $match = $Line | Select-String -pattern "^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"
        $dateAsStr = $match.Matches.Groups[1].Value
        $dateParsed = [System.DateTimeOffset]::Parse($dateAsStr, $null, [System.Globalization.DateTimeStyles]::AssumeUniversal)
        $dateLocal = $dateParsed.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss")
        $Line -replace $dateAsStr, $dateLocal
    }
}

# By default PowerShell captures bytes and interprets them as a string using [Console]::OutputEncoding
# which by default (for me) is code page 850. This means that if the external commands outputs UTF-8 characters,
# some will be misinterpreted (like emojis).
# To avoid this, we set the output encoding to UTF-8 before running the commands.
$currentEncoding = [Console]::OutputEncoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Output "Downloading logs from bouncer-1..."
render logs -o text -r bouncer-1 | Remove-TerminalControlCharacters | Update-TimeZone > logs-1.log
Write-Output "Downloading logs from bouncer-2..."
render logs -o text -r bouncer-2 | Remove-TerminalControlCharacters | Update-TimeZone > logs-2.log
Write-Output "Downloading logs from bouncer-3..."
render logs -o text -r bouncer-3 | Remove-TerminalControlCharacters | Update-TimeZone > logs-3.log

[Console]::OutputEncoding = $currentEncoding
