<template>
  <div id="room">
  <h1>{{ code }}</h1>
  </div>
</template>
<script>
import SimplePeer from 'simple-peer';
import * as firebase from "firebase";
const fb = require('../firebaseConfig.js');

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
    if(this.host === true){
      await this.createRoom();
    }else {
      await this.joinRoom();
    }
  },
  methods: {
    createRoom: async function (){
      const roomCode = '4444';
      this.$store.commit('setRoomId', roomCode);
      const room = fb.db.ref('rooms/' + roomCode);
      await room.set({time: firebase.database.ServerValue.TIMESTAMP});
      console.log("create room : ", roomCode);
      this.joinRoom()
    },
    joinRoom: async function (){
      console.log('Join room: ', this.code);
      const roomRef = fb.db.ref('rooms/'+ this.code + '/Callers/');

      const localStream =  await navigator.mediaDevices.getUserMedia(
        {video: true, audio: true});

      //add main video
      this.createVideo(localStream, true, this.name);

      //First caller is never the initiator
      if(this.host === true){
        this.initiator = false;
      }

      //count current participant
      let nbOfParticipant;
      const connectedLobby = fb.db.ref('/rooms/'+this.code+'/connected/');
      await connectedLobby.once('value', function(snapshot) {
        nbOfParticipant = snapshot.numChildren();
        console.log('Number of already connected : ' +  snapshot.numChildren());
      });

      //Register as connected
      const connected = fb.db.ref('/rooms/'+this.code+'/connected/'+this.name);
      await connected.set({status:'connected'});

      //Momment crucial
      connectedLobby.on("child_added", ({key: connectedName}) => {
        if(connectedName !== this.name && this.initiator === true){

          const peer = new SimplePeer({initiator : true, stream: localStream});

          // 1 Initiator sends offer (1st step)
          peer.on('signal', data => {
            if(this.initiator === true){
              console.log('Generating offer for : ' + connectedName, JSON.stringify(data));
              const callerRef = roomRef.child(this.name);
              const newSignal = callerRef.push();
              newSignal.set({
                data:JSON.stringify(data),
                to: connectedName,
                from: this.name
              })
            }
          });

          //Initiator receives answer step 5
          const hostSignalRef = fb.db.ref('/rooms/'+this.code+'/answers/'+this.name);
          hostSignalRef.on('child_added', (res) => {
            if(this.initiator === true && res.val().from === connectedName){
              console.log(res.val().to + ' received something from ' + res.val().from);
              peer.signal(JSON.parse(res.val().data));
            }
          });

          peer.on('stream', stream => {
            if(this.initiator === true){
              this.nbConnected++;
              console.log('Initiator Got a stream for : ' + connectedName, stream);
              this.createVideo(stream, false, connectedName);
              this.peerList.push(peer);
              if(nbOfParticipant === this.nbConnected){
                this.initiator = false;
              }
              console.log('There is ' + this.nbConnected + ' other connected')
            }
          });
        }
      });

      //We're in the call waiting for other (step 2)
      roomRef.endAt().limitToLast(1).on('child_added', ({key: callerName}) => {
        if(callerName !== this.name && this.initiator === false){

          const peer = new SimplePeer({initiator: false, stream: localStream});

          //step 4
          peer.on('signal', data => {
            console.log(this.name + ' Generating answer for ' + callerName, JSON.stringify(data));
            const signalDataRef = fb.db.ref('/rooms/'+this.code+'/answers/'+callerName);
            const newSignalDataRef = signalDataRef.push();
            newSignalDataRef.set({
              data: JSON.stringify((data)),
              to: callerName,
              from: this.name
            })
          });

          //step 3
          const callerRef = roomRef.child(callerName);
          callerRef.on('child_added', (res) =>{
            if(res.val().to === this.name){
              console.log(res.val().to + ' received something from ', res.val().from);
              peer.signal(JSON.parse(res.val().data))
            }
          });

          peer.on('stream', stream => {
            console.log('Got a stream from : ' + callerName, stream);
            this.createVideo(stream, false, callerName);
            this.peerList.push(peer)
          })
        }
      });
    },
    createVideo: function(stream, currentUser, callerName){
      const user = document.createElement('video');
      const textUser = document.createElement('div');
      textUser.className = "overlay-name";
      textUser.innerText = callerName;
      user.srcObject = stream;
      const room = document.getElementById('room');
      room.appendChild(user);
      room.appendChild(textUser);
      user.play();
      if(currentUser === true){
        user.muted = true;
      }
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
