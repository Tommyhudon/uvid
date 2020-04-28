<template>
  <div id="home">
    <h1>Welcome to Uvid</h1>
    <h3>Please enter your name before joining</h3>
					<b-button rounded size="is-medium" type="is-success" @click="createRoomModal = true">Create</b-button>
				<b-button rounded size="is-medium" type="is-success" @click="joinRoomModal = true">Join</b-button>


			<b-modal :active.sync="createRoomModal" has-modal-card>
				<div>
					<b-input placeholder="Add your name" type="text" class="name-input"></b-input>
					<router-link :to="{name: 'Call'}">
						<b-button rounded size="is-medium" type="is-success" @click="createRoom">Create</b-button>
					</router-link>
				</div>
			</b-modal>

			<b-modal :active.sync="joinRoomModal" has-modal-card>
				<div>
					<b-input placeholder="Add your name" type="text" class="name-input" :value="name"></b-input>
					<b-input placeholder="Enter code" type="text" class="name-input" v-model="roomCode"></b-input>
					<b-button rounded size="is-medium" type="is-success" @click="joinRoom">Join</b-button>
				</div>
			</b-modal>
  </div>
</template>

<script>
const fb = require('../firebaseConfig.js');
import * as firebase from 'firebase';
export default {
  name: 'Home',
  data : function() {
    return {
      name: '',
      roomCode: '',
      createRoomModal: false,
      joinRoomModal: false
    }
  },
  methods: {
    createRoom: function (){
      this.$store.commit('setHost')
      this.$store.commit('setUsername', name);
    },
    joinRoom: async function (){
      this.$store.commit('setRoomId', this.roomCode);
      const roomRef = fb.firestore.collection('rooms').doc(`${this.roomCode}`);
      const roomSnapshot = await roomRef.get();
      console.log('Got room:', roomSnapshot.exists);
      if (!roomSnapshot.exists) {
        console.log('room doesnt exist')
      } else {
        await this.$router.push('Call');
      }
    },
  }
}
</script>

<style scoped lang="scss">
#home {
  padding-top: 15vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #110022;
  min-height: 100vh;
}
</style>
