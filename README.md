# Scheduling service

![Microservice](https://img.shields.io/badge/microservice-ready-brightgreen.svg?style=for-the-badge)
[![Build status](https://img.shields.io/travis/com/oms-services/scheduler/master.svg?style=for-the-badge)](https://travis-ci.com/oms-services/scheduler)

An OMS event schedule service.
It allows to schedule future events and subscribe to them.

Scheduled events will be waited for a defined `delay` (aka `timeout`).

Usage
-----

```coffee
# Storyscript
scheduler event name: 'expire' delay: 1000 data: {"your": "data"}

when scheduler event triggered name: 'expire' as event
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
