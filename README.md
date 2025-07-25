# Build it
```
npm install
```

# Run it
```
node app.js
```

# How to get logs?
```PowerShell
function Remove-TerminalControlCharacters($line) {
    # https://stackoverflow.com/a/58297270/2377787
    # https://stackoverflow.com/questions/36279015/what-does-x1bb-do
    return $line -replace '\x1b\[[0-9;]*m|\x1b\(B',''
}
render logs -o text -r bouncer-1 | ForEach-Object { Remove-TerminalControlCharacters($_) } > logs-1.log
render logs -o text -r bouncer-2 | ForEach-Object { Remove-TerminalControlCharacters($_) } > logs-2.log
render logs -o text -r bouncer-3 | ForEach-Object { Remove-TerminalControlCharacters($_) } > logs-3.log

```

# TODOs
- Try out collatz conjecture
