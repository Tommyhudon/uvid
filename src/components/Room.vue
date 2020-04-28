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
  data : function() {
    return{
      peerConnection : null,
      localStream: null,
      remoteStream: null
    }
  },
  computed: {
    code() {
      return this.$store.state.roomId
    },
    configuration(){
      return this.$store.state.configuration;
    },
    host() {
      return this.$store.state.host
    }
  },
  created: async function() {
    await this.openUserMedia();
    if(this.host === true){
      await this.createRoom();
    }else {
      console.log('Lets go')
      await this.joinRoom();
    }
  },
  methods: {
    createRoom: async function (){
      const roomRef = await fb.firestore.collection('rooms').doc();

      console.log('Create PeerConnection with configuration ', this.configuration);
      this.peerConnection = new RTCPeerConnection(this.configuration);

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      //Code for collection ICE candidate
      const callerCandidatesCollection = roomRef.collection('callerCandidates');

      this.peerConnection.addEventListener('icecandidate', event => {
        if(!event.candidate){
          console.log('Got final candidate!');
          return;
        }
        console.log('Got candidate', event.candidate);
        callerCandidatesCollection.add(event.candidate.toJSON());
      });

      //Code for creating a room
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('Created offer', offer);

      const roomWithOffer = {
        'offer' : {
          type: offer.type,
          sdp: offer.sdp
        }
      };

      await roomRef.set(roomWithOffer);
      this.$store.commit('setRoomId', roomRef.id);
      console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);


      this.peerConnection.addEventListener('track', event => {
        console.log('Got remote track', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log('Add a track to the remoteStream', track);
          this.remoteStream.addTrack(track);
        })
      });

      //Listening for remote session
      roomRef.onSnapshot(async snapshot => {
        const data = snapshot.data();
        if(!this.peerConnection.currentRemoteDescription && data && data.answer) {
          console.log('Got remote description', data.answer);
          const rtcSessionDescription = new RTCSessionDescription(data.answer);
          await this.peerConnection.setRemoteDescription(rtcSessionDescription);
        }
      });

      //listen for remote ICE candidates below
      roomRef.collection('calleeCandidates').onSnapshot((snapshot => {
        snapshot.docChanges().forEach(async change => {
          if(change.type === 'added') {
            let data = change.doc.data();
            console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data))
          }
        })
      }))
    },
    joinRoom: async function (){
      console.log('Join room: ', this.code);
      const roomRef = fb.firestore.collection('rooms').doc(`${this.code}`);
      const roomSnapshot = await roomRef.get();

      console.log('Create PeerConnection with configuration: ', this.configuration);
      this.peerConnection = new RTCPeerConnection(this.configuration);

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Code for collecting ICE candidates below
      const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
      this.peerConnection.addEventListener('icecandidate', event => {
        if (!event.candidate) {
          console.log('Got final candidate!');
          return;
        }
        console.log('Got candidate: ', event.candidate);
        calleeCandidatesCollection.add(event.candidate.toJSON());
      });

      this.peerConnection.addEventListener('track', event => {
        console.log('Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log('Add a track to the remoteStream:', track);
          this.remoteStream.addTrack(track);
        });
      });

      // Code for creating SDP answer below
      const offer = roomSnapshot.data().offer;
      console.log('Got offer:', offer);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      console.log('Created answer:', answer);
      await this.peerConnection.setLocalDescription(answer);

      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      };
      await roomRef.update(roomWithAnswer);

      // Listening for remote ICE candidates below
      roomRef.collection('callerCandidates').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            let data = change.doc.data();
            console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    },
    openUserMedia: async function() {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        {video: true, audio: true});
      this.remoteStream = new MediaStream();
      console.log(this.remoteStream);
      console.log(this.localStream);

      const user = document.createElement('video');
      const remoteUser = document.createElement('video');

      remoteUser.srcObject = this.remoteStream;
      user.srcObject = this.localStream;

      const room = document.getElementById('room');
      room.appendChild(user);
      room.appendChild(remoteUser);

      user.play();
      user.muted = true;
      remoteUser.play();

    }
  }
}
</script>
<style>
	#room {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: #110022;
		min-height: 100vh;
	}
</style>
