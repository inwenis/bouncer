https://bounce.ovh/

Bounces a package between a few nodes.

# Build it
```
npm install
```

# Run it
```
node app.js
```

# TODOs
- Try out collatz conjecture

# Why do I use pretty-print in prod?
Because I haven't setup logs integration it's easier view pretty logs after ssh-ing into a PROD machine.

# Used to make HTTPS work
- https://letsencrypt.org/getting-started/
- https://certbot.eff.org/instructions?ws=other&os=snap
- https://snapcraft.io/docs/installing-snap-on-ubuntu

# Connect to prod servers
```PowerShell
ssh root@bounce.ovh     # prod-1
ssh root@185.70.196.252 # prod-2
ssh root@5.22.219.66    # prod-3
```
