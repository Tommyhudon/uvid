<template>
  <div id="home">
    <h1>Welcome to Uvid</h1>
    <h3>Please enter your name before joining</h3>
					<b-button rounded size="is-medium" type="is-success" @click="createRoomModal = true">Create</b-button>
				<b-button rounded size="is-medium" type="is-success" @click="joinRoomModal = true">Join</b-button>


			<b-modal :active.sync="createRoomModal" has-modal-card>
				<div>
					<b-input placeholder="Add your name" type="text" class="name-input"  v-model="name"></b-input>
					<b-button rounded size="is-medium" type="is-success" @click="createRoom">Create</b-button>
				</div>
			</b-modal>

			<b-modal :active.sync="joinRoomModal" has-modal-card>
				<div>
					<b-input placeholder="Add your name" type="text" class="name-input" v-model="name"></b-input>
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
    createRoom: async function (){
      if(this.name === ''){
        this.$buefy.dialog.alert('Name must be filled out');
        return false;
      }
      this.$store.commit('setHost');
      this.$store.commit('setUsername', this.name);
      await this.$router.push('Call');
    },
    joinRoom: async function (){

      if(this.name === '' || this.roomCode === ''){
        this.$buefy.dialog.alert('Name and Code must be filled out');
        return false;
      }

      this.$store.commit('setRoomId', this.roomCode);
      this.$store.commit('setUsername', this.name);
      const room = fb.db.ref('rooms/'+ this.roomCode);

      room.once('value').then((snapshot) => {
        const roomData = snapshot.val();
        if(roomData == null){
          this.$buefy.dialog.alert('Room does not exist')
        }else {
          this.$router.push('Call');
        }
      })
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
