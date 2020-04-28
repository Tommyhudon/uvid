import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    host: false,
    username : '',
    configuration : {
      iceServers: [
        {
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    },
    roomId: null,
  },
  actions: {

  },
  mutations: {
    setName(state, name) {
      state.currentUser = name;
    },
    setRoomId(state, id) {
      state.roomId = id;
    },
    setHost(state){
      state.host = true;
    },
    setUsername(state, username){
      state.username = username;
    }
  },
  getters: {

  }
});
