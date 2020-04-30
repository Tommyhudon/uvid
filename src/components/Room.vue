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

      if(this.host === true){

        //Listen to connection
        roomRef.on('child_added', ({key: callerName}) => {
          const peer = new SimplePeer({stream: localStream});
          if(callerName !== this.name){
            console.log("new child", callerName);

            const signalDataRef = fb.db.ref('/rooms/' + this.code + '/host/' + callerName);
            peer.on('signal', (signalData) => {
              console.log('Nouveau joueur');
              const newSignalDataRef = signalDataRef.push();
              newSignalDataRef.set({
                data: JSON.stringify(signalData)
              });
            });

            //Listen caller signaling data
            const callerRef = roomRef.child(callerName);
            callerRef.on('child_added', (res) =>
              peer.signal(JSON.parse(res.val().data)));


            peer.on('stream', stream => {
              if(stream !== undefined){
                console.log('streaming', stream)
                const remoteStream = document.createElement('video');
                const textUser = document.createElement('div');
                textUser.innerText = callerName;
                remoteStream.srcObject = localStream;
                const room = document.getElementById('room');
                room.appendChild(remoteStream);
                room.appendChild(textUser)
                remoteStream.play();
              }
            })
          }
        })
      }else {
        const nameRef = fb.db.ref('/rooms/' + this.code + '/Callers/' + this.name);
        console.log('mon nom', this.name);
        const peer = new SimplePeer({initiator: true, stream: localStream});

        peer.on('signal', (signalData) => {
          console.log('joueur on');
          const newSignalDataRef = nameRef.push();
          newSignalDataRef.set({
            data: JSON.stringify(signalData)
          });
        });

        // Recieving signal
        const hostSignalRef = fb.db.ref('/rooms/'+this.code+'/host/'+this.name);
        hostSignalRef.on('child_added', (res) => {
          console.log('player signal');
          peer.signal(JSON.parse(res.val().data));
        });

        peer.on('stream', stream => {
          if(stream !== undefined){
            console.log('streaming', stream);
            const remoteStream = document.createElement('video');
            const textUser = document.createElement('div');
            textUser.innerText = this.name;
            remoteStream.srcObject = localStream;
            const room = document.getElementById('room');
            room.appendChild(remoteStream);
            room.appendChild(textUser);
            remoteStream.play();
          }
        });
        roomRef.on('child_added', ({key: callerName}) => {
          if(callerName !== this.name){
            console.log('new kid', callerName);
            const peer = new SimplePeer({initiator: true, stream:localStream});

            const callerRef = roomRef.child(callerName);
            callerRef.on('child_added', (res) =>
              peer.signal(JSON.parse(res.val().data)));


            peer.on('stream', stream => {
              if(stream !== undefined){
                console.log('streaming', stream);
                const remoteStream = document.createElement('video');
                const textUser = document.createElement('div');
                textUser.innerText = this.name;
                remoteStream.srcObject = localStream;
                const room = document.getElementById('room');
                room.appendChild(remoteStream);
                room.appendChild(textUser);
                remoteStream.play();
              }
            });

          }
          console.log(callerName);
        });

        /*peer.on('stream', stream => {
          if(stream !== undefined){
            console.log('streaming', stream)
            const remoteStream = document.createElement('video');
            const textUser = document.createElement('div');
            textUser.innerText = this.name;
            remoteStream.srcObject = localStream;
            const room = document.getElementById('room');
            room.appendChild(remoteStream);
            room.appendChild(textUser)
            remoteStream.play();
          }
        });*/
      }

      //add video
      /*const user = document.createElement('video');
      const textUser = document.createElement('div');
      textUser.className = "overlay-name";
      textUser.innerText = this.name;

      user.srcObject = localStream;
      const room = document.getElementById('room');
      room.appendChild(user);
      room.appendChild(textUser)
      user.play();
      user.muted = true;*/

      //Caller writes his name and notify everyone he's here
      /*localPeer.on('signal', signalData => {
        console.log('LocalPeer signal', signalData);
        const callerRef = roomRef.child(this.name);
        const newSignalDataRef = callerRef.push();
        newSignalDataRef.set({
          data:JSON.stringify(signalData)
        })
      });*/

      /*const myOffers = fb.db.ref('rooms/'+ this.code + '/Callers/' + this.name + '/offers/');
      myOffers.on('child_added', (res) => {
        console.log('people love me');
        const peer = new SimplePeer({trickle : false});
        peer.signal(JSON.parse(res.val().data))
      });*/


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
