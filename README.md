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

# Connect to prod servers
```PowerShell
ssh root@prod-1.bounce.ovh # also available as bounce.ovh
ssh root@prod-2.bounce.ovh
ssh root@prod-3.bounce.ovh
```

# Setup server

```bash
sudo apt update
sudo apt --yes install nodejs
sudo apt --yes install npm
git clone https://github.com/inwenis/bouncer
cd bouncer
npm install
chmod +x run.sh
```

## Certificate setup
```bash
sudo apt update
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
pkill -f "node app.js"
sudo certbot certonly --standalone
```

References:
- https://letsencrypt.org/getting-started/
- https://certbot.eff.org/instructions?ws=other&os=snap
- https://snapcraft.io/docs/installing-snap-on-ubuntu
