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
render logs -o text -r bouncer-1 | Remove-TerminalControlCharacters > logs-1.log
render logs -o text -r bouncer-2 | Remove-TerminalControlCharacters > logs-2.log
render logs -o text -r bouncer-3 | Remove-TerminalControlCharacters > logs-3.log
