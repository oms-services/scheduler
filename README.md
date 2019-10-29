# Microservice template for NodeJS

![Microservice](https://img.shields.io/badge/microservice-ready-brightgreen.svg?style=for-the-badge)
[![Build status](https://img.shields.io/travis/com/microservices/node/master.svg?style=for-the-badge)](https://travis-ci.com/microservices/node)

An OMS template for NodeJS.

Usage
-----

```coffee
# Storyscript
schedule event name: 'expire' delay: 1000 data: {"your": "data"}

when schedule event triggered name: 'expire' as event
  log info msg: "${event}"
```

Test
----

```sh
$ oms run event -a name=expire -a delay=1000 -data='{"your":"data"}'
```

```sh
$ oms subscribe --debug event triggered -a name=expire
```
