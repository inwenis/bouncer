# -AsByteStream is needed to avoid PowerShell adding \r to line endings
# bash interprets \r as part of the commands and fails to execute commands like "ls\r"
Get-Content scripts/deploy.sh -AsByteStream | ssh root@prod-3.bounce.ovh 'bash -s'
Get-Content scripts/deploy.sh -AsByteStream | ssh root@prod-2.bounce.ovh 'bash -s'
Get-Content scripts/deploy.sh -AsByteStream | ssh root@bounce.ovh 'bash -s'
