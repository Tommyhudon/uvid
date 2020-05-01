<template>
  <div id="room">
  <h1>{{ code }}</h1>
  </div>
</template>
<script>
import router from '../router'
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
      caller: {
        callerName: null,
        stream: null,
        peer: null,
        offer: false,
        answer: false
      }
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
    createPeer: async function(initiator, stream){
      return new SimplePeer({initiator: initiator, stream: stream, trickle: false})
    },
    createRoom: async function (){
      //const roomRef = await fb.firestore.collection('rooms').doc();
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
      this.caller.stream = localStream;

      //add video main video
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

          const peer = new SimplePeer({
            initiator : true,
            stream: localStream,
            trickle: false
          });

          let caller = {callerName: connectedName, peer: peer, offer: false, answer: false};
          peer.on('error', err => {
            console.log('error', err)
          });

          // 1 Initiator sends offer (1st step)
          peer.on('signal', data => {
            if(this.initiator === true){
              //caller.offer = true;
              console.log('Generating offer for : ' + caller.callerName, JSON.stringify(data));
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
          const hostSignalRef = fb.db.ref('/rooms/'+this.code+'/host/'+this.name);
          hostSignalRef.on('child_added', (res) => {
            if(this.initiator === true && res.val().from === connectedName){
              const validateAnswer = JSON.parse(res.val().data);
              if(validateAnswer.type === 'answer'){
                caller.answer = true;
                console.log(res.val().to + ' Got answer from ' + res.val().from + res.val().data)
              }
              console.log(res.val().to + ' received something from ' + res.val().from);
              peer.signal(JSON.parse(res.val().data));
            }
          });

          /*peer.on('connect', () => {
            if(this.initiator === true){
              console.log('CONNECT');
              peer.send(this.name);
            }
          });*/

          /*peer.on('data', data => {
            if(this.initiator === true){
              console.log('data : '  + data);
              this.caller.callerName = data;
              this.initiator = false;
            }
          });*/

          peer.on('stream', stream => {
            if(this.initiator === true){
              this.nbConnected++;
              console.log('Initiator Got a stream for : ' + caller.callerName, stream);
              this.createVideo(stream, false, caller.callerName);
              this.peerList.push(caller);
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

          const peer = new SimplePeer({initiator: false, stream: localStream, trickle: false});
          let caller = {callerName: callerName, peer: peer, offer: false, answer: false};

          //step 4
          peer.on('signal', data => {
            console.log(this.name + ' Generating answer for ' + callerName, JSON.stringify(data));
            const signalDataRef = fb.db.ref('/rooms/'+this.code+'/host/'+callerName);
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

          /*peer.on('connect', () => {
            console.log('CONNECT');
            peer.send(this.name);
          });*/

          /*peer.on('data', data => {
            console.log('data : '  + data)
          });*/

          peer.on('stream', stream => {
            console.log('Got a stream from : ' + callerName, stream);
            this.createVideo(stream, false, callerName);
            this.peerList.push(caller)
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
