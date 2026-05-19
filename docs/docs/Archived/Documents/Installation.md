---
sidebar_position: 3
---

# Installation

Archived note: this page documents the older Voyager/Fabric/manual-server setup.
It is not the active headless probe path.

### Dependenceis
- Pyhton: v3.9
- Node: v18

### Prepare JDK 21>=
- For example, donwload the installation file from [https://www.oracle.com/java/technologies/downloads/#jdk22-mac](https://www.oracle.com/java/technologies/downloads/#jdk22-mac).

### Download and Run Fabric Minecraft Server Launcher on local
```shell
chmod 751 scripts/*run*.sh

# If a server isn't installed 
scripts/download_run_server.sh

# IF a server is already install 
scripts/run_server.sh
```
### Set world
- seed: 637184628307790
- coordinate: 63 94 168
Set the x y z position on the server command
```
/setworldspawn 63 94 168
```

server.properties: These settings will automatically set via download_run_server.sh.
```txt
difficulty=peaceful
gamemode=survival
online-mode=false
enable-rcon=true # Only needed if you wish to use RCON features
rcon.password=hunter2
rcon.port=25575
spawn-protection=0 # This is important, otherwise the bot can't do anything near the spawn
```
### Make python environment
```shell
# install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# install dependencies
make install
```

### Install mineflayer and additional minecraft interface library
```shell
npm install mineflayer

cd voyager/env/mineflayer
npm install -g npx
npm install
cd mineflayer-collectblock
npm install
npx tsc
cd ..
npm install
```

### Set environment variables
Make `.env` file and set environment variables like `.env.sample`.

#### Set bot as op
If it's not op, the server will kick the bot because of the chat.
```shell
/op bot
```
