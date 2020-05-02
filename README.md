# uvid

### Link to the app

https://secret-refuge-14421.herokuapp.com/

### Choices of technologies
* **Frontend frameworks**: [Vuex](https://vuex.vuejs.org/)
* **Backend frameworks**: [Express](https://expressjs.com/). Small server only for the Heroku deployment.
* **Backend language**: [Javascript] with [NodeJs]
* **Database**: [Firebase Real-time Datbase](https://firebase.google.com/docs/database). I use this instead of a server with websocket for signaling between peers.
* **Other technologies**: [simple-peer](https://github.com/feross/simple-peer). An npm package for WebRTC video, voice, and data channels.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
