import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    host: false,
    username : '',
    roomId: null,
  },
  mutations: {
    setRoomId(state, id) {
      state.roomId = id;
    },
    setHost(state){
      state.host = true;
    },
    setUsername(state, username){
      state.username = username;
    }
  }
});
