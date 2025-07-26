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

# By default PowerShell captures bytes and interprets them as a string using [Console]::OutputEncoding
# which by default (for me) is code page 850. This means that if the external commands outputs UTF-8 characters,
# some will be misinterpreted (like emojis).
# To avoid this, we set the output encoding to UTF-8 before running the commands.
$currentEncoding = [Console]::OutputEncoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

render logs -o text -r bouncer-1 | Remove-TerminalControlCharacters > logs-1.log
render logs -o text -r bouncer-2 | Remove-TerminalControlCharacters > logs-2.log
render logs -o text -r bouncer-3 | Remove-TerminalControlCharacters > logs-3.log

[Console]::OutputEncoding = $currentEncoding
