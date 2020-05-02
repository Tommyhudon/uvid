<template>
  <div>
  <h1>{{ code }}</h1>
			<div id="room">
			</div>
  </div>
</template>
<script>
import SimplePeer from 'simple-peer';
import * as firebase from "firebase";
const fb = require('../firebaseConfig.js');
const database = fb.db;

export default {
  name: 'Room',
  data: function() {
    return{
      initiator: true,
      peerList: [],
      nbConnected : 0,
    }
  },
  computed: {
    code() {
      return this.$store.state.roomId
    },
    host() {
      return this.$store.state.host
    },
    name(){
      return this.$store.state.username
    },
  },
  created: async function() {
    if(this.name === ''){
      await this.$router.push('/');
    }
    if(this.host === true){
      await this.createRoom();
    }
    await this.joinRoom();

  },
  methods: {
    createRoom: async function (){
      const roomCode = this.generateCode();
      this.$store.commit('setRoomId', roomCode);
      const room = database.ref('rooms/' + roomCode);
      await room.set({time: firebase.database.ServerValue.TIMESTAMP});
    },
    joinRoom: async function (){
      const callersRef = database.ref('rooms/'+ this.code + '/Callers/');
      const localStream =  await navigator.mediaDevices.getUserMedia(
        {video: true, audio: true});
      this.createVideo(localStream, true);

      if(this.host === true){
        this.initiator = false;
      }

      let nbOfParticipant;
      const connectedRef = database.ref('/rooms/'+this.code+'/connected/');
      await connectedRef.once('value', function(snapshot) {
        nbOfParticipant = snapshot.numChildren();
      });

      const connectedName = nbOfParticipant + '-' + this.name;
      this.$store.commit('setUsername', connectedName);
      const connected = database.ref('/rooms/'+this.code+'/connected/'+this.name);
      await connected.set({status:'connected'});

      connectedRef.on("child_added", ({key: connectedName}) => {
        if(connectedName !== this.name && this.initiator === true){

          const peer = new SimplePeer({initiator : true, stream: localStream});

          peer.on('signal', data => {
            if(this.initiator === true){
              const callerRef = callersRef.child(this.name);
              const newSignal = callerRef.push();
              newSignal.set({
                data:JSON.stringify(data),
                to: connectedName,
                from: this.name
              })
            }
          });

          const answersSignalRef = database.ref('/rooms/'+this.code+'/answers/'+this.name);
          answersSignalRef.on('child_added', (res) => {
            if(this.initiator === true && res.val().from === connectedName){
              peer.signal(JSON.parse(res.val().data));
            }
          });

          peer.on('stream', stream => {
            if(this.initiator === true){
              this.nbConnected++;
              this.createVideo(stream, false);
              this.peerList.push(peer);
              if(nbOfParticipant === this.nbConnected){
                this.initiator = false;
              }
            }
          });
        }
      });

      callersRef.endAt().limitToLast(1).on('child_added', ({key: callerName}) => {
        if(callerName !== this.name && this.initiator === false){

          const peer = new SimplePeer({initiator: false, stream: localStream});

          peer.on('signal', data => {
            const signalDataRef = database.ref('/rooms/'+this.code+'/answers/'+callerName);
            const newSignalDataRef = signalDataRef.push();
            newSignalDataRef.set({
              data: JSON.stringify((data)),
              to: callerName,
              from: this.name
            })
          });

          const callerRef = callersRef.child(callerName);
          callerRef.on('child_added', (res) =>{
            if(res.val().to === this.name){
              peer.signal(JSON.parse(res.val().data))
            }
          });

          peer.on('stream', stream => {
            this.createVideo(stream, false);
            this.peerList.push(peer)
          })
        }
      });
    },
    createVideo: function(stream, currentUser) {
      const user = document.createElement('video');;
      const videoContainer = document.createElement('div');
      videoContainer.className = 'video-container';
      user.srcObject = stream;
      const room = document.getElementById('room');
      videoContainer.appendChild(user);
      room.appendChild(videoContainer);
      user.play();
      if(currentUser === true){
        user.muted = true;
      }
    },
    generateCode: function() {
      const roomCodeOptions = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let code = '';
      for(let i=0; i<4; i++){
        const ndx = Math.floor(Math.random() * roomCodeOptions.length);
        code += roomCodeOptions[ndx];
      }
      return code;
    }
  }
}
</script>
<style lang="scss">
	h1 {
		background-color: #110022;
		padding-top: 10px;
		padding-bottom: 10px;
	}
	#room {
		display: flex;
		background-color: #110022;
		min-height: 100vh;
		padding: 5vh;
		align-content: stretch;
		flex-wrap: wrap;
		flex-direction: row;
		justify-content: center;
		.video-container {
			max-width:450px;
			margin: 15px;
			video {
				height: auto;
				width: 100%;
			}
		}
	}
</style>
