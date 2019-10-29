#!/usr/bin/env node

const Koa = require('koa');
const body = require('koa-json-body');
const cp = require('child_process');
const request = require('request');
const router = require('koa-router')();

const app = new Koa();
const port = 8080;

var hostIP = "";
// Workaround for https://github.com/microservices/omg-cli/issues/181
cp.exec("ip -4 route list match 0/0", (e, stdout, stderr) => {
  hostIP = stdout.split(" ")[2];
});
function normalize(url) {
  return url.replace("host.docker.internal", hostIP);
}

// A simple manager which tracks all event subscriptions
class Manager {
  constructor() {
    this._events = {}
    this._nrSentEvents = 0;
  }

  subscribe(id, endpoint, eventName, payload) {
    payload = payload || {};
    console.log(`[subscribe] id:'${id}', endpoint:'${endpoint}', `+
                `name:'${eventName}', payload: `, payload);
    if (this._events[eventName] === undefined) {
      this._events[eventName] = {};
    }
    // check that the id is new
    if (this._events[eventName][id] !== undefined) {
      return false;
    }
    this._events[eventName][id] = {
      endpoint,
      payload,
    }
    return true;
  }

  unsubscribe(id, eventName) {
    console.log(`[unsubscribe] id:'${id}', name:'${eventName}'`);
    // check that the id belongs to a listener
    if (this._events[eventName] === undefined ||
        this._events[eventName][id] === undefined) {
      return false;
    }
    delete this._events[eventName][id];
    return true;
  }

  publish(eventName, scheduleName, delay, data) {
    console.log(`[schedule] '${eventName}' delay: ${delay} data: `, data);
    // output data format
    data = {
      name: scheduleName,
      data,
    }
    // TODO: serialize scheduled events
    setTimeout(() => {
      // check for subscribers
      console.log(`[triggered] '${eventName}' delay: ${delay} data: `, data);
      if (this._events[eventName] === undefined) {
        return false;
      }
      Object.values(this._events[eventName]).forEach(node => {
          // filter for actual schedule event name (no name selector -> all)
          if (node.payload.name === undefined || node.payload.name === scheduleName) {
            console.log(`[sending] '${eventName}' to node: `, node.endpoint);
            this._sendEvent(node, eventName, data);
          }
      });
    }, delay * 1000);
    return true;
  }

   /*
    Send events as CloudEvent JSON.
    See also: https://github.com/cloudevents/spec/blob/master/json-format.md
   */
  _sendEvent(node, eventName, eventData) {
    return request.post(normalize(node.endpoint), {
      json: {
        eventType: eventName,
        type: 'com.microservices.schedule',
        specversion: '0.2',
        source: '/oms-scheduler',
        id: `OMS-SCHEDULER-${this._nrSentEvents++}`,
        time: (new Date()).toISOString(),
        datacontenttype: 'application/json',
        data: eventData,
      }
    });
  }
}

const manager = new Manager();

// connect pubsub endpoints with the event controller
router.post('/subscribe', (ctx, next) => {
  const { id, endpoint, event, data} = ctx.request.body;
  console.log('attempting a subscribe for: ', id, endpoint);
  ctx.body = {success: manager.subscribe(id, endpoint, event, data)};
});

router.delete('/subscribe', ctx => {
  const { id, event } = ctx.request.body;
  ctx.body = {success: manager.unsubscribe(id, event)};
});

router.post('/schedule', ctx => {
  const { name, data, delay } = ctx.request.body;
  ctx.body = {success: manager.publish('triggered', name, delay, data)};
});

router.get('/health', ctx => {
  ctx.body = 'OK';
});

app.use(body())
app.use(router.routes());
app.listen(port);
console.log(`Listening on localhost:${port}`);
