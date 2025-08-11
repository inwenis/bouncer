#!/bin/bash

pkill -f "node app.js"
setsid node app.js &> all.logs &
