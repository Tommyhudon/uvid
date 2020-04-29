<template>
  <div id="room">
  <h1>{{ code }}</h1>
  </div>
</template>
<script>
import router from '../router'
import SimplePeer from 'simple-peer';
const fb = require('../firebaseConfig.js');

export default {
  name: 'Room',
  computed: {
    code() {
      return this.$store.state.roomId
    },
    configuration(){
      return this.$store.state.configuration
    },
    host() {
      return this.$store.state.host
    },
    name(){
      return this.$store.state.username
    }
  },
  created: async function() {
    //await this.openUserMedia();
    if(this.host === true){
      await this.createRoom();
    }else {
      await this.joinRoom();
    }
  },
  methods: {
    createRoom: async function (){
      //const roomRef = await fb.firestore.collection('rooms').doc();
      const roomCode = '4444';
      this.$store.commit('setRoomId', roomCode);
      const room = fb.db.ref('rooms/' + roomCode + '/host');
      await room.set({username: this.name});
      console.log("create room : ", roomCode);
      this.joinRoom()
    },
    joinRoom: async function (){
      console.log('Join room: ', this.code);
      const roomRef = fb.db.ref('rooms/'+ this.code + '/Callers');

      const localStream =  await navigator.mediaDevices.getUserMedia(
        {video: true, audio: true});

      //add video
      const user = document.createElement('video');
      const textUser = document.createElement('div');
      textUser.className = "overlay-name";
      textUser.innerText = this.name;

      user.srcObject = localStream;
      const room = document.getElementById('room');
      room.appendChild(user);
      room.appendChild(textUser)
      user.play();
      user.muted = true;

      const localPeer = new SimplePeer({initiator: true, stream: localStream});


      //Send signal
      localPeer.on('signal', signalData => {
        console.log('LocalPeer signal', signalData);
        const callerRef = roomRef.child(this.name);
        const newSignalDataRef = callerRef.push();
        newSignalDataRef.set({
          data:JSON.stringify(signalData)
        })
      });

      //Listen to connection
      roomRef.on('child_added', ({key: callerName}) => {
        if(callerName !== this.name){
          console.log("new child", callerName);
          const peer = new SimplePeer();

          //Listen to other caller's signal
          const callerRef = roomRef.child(callerName);
          callerRef.on('child_added', (res) => {
            console.log('Caller doing something', res);
            peer.signal(JSON.parse(res.val().data))
          });

          peer.on('stream', (stream) => {
										  if(stream === undefined){
										    console.log('no stream')
            }else{
										    console.log('yes stream');

              const remoteCallerName = document.createElement('div');
              remoteCallerName.className = "overlay-name";
              remoteCallerName.innerText = callerName;

              const newCaller = document.createElement('video');
              newCaller.srcObject = localStream;
              const room = document.getElementById('room');
              room.appendChild(newCaller);
              room.appendChild(remoteCallerName)
              newCaller.play();
            }
          })
        }
      })
    },
  }
}
</script>
<style lang="scss">
	#room {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: #110022;
		min-height: 100vh;
			video {
				z-index: 0;
				height: 300px;
				width: 300px;
			}
			.overlay-name{
				z-index: 1
			}
	}
</style>
