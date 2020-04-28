<template>
  <div class="camera">
    <video class="feed"></video>
  </div>
</template>
<script>
export default {
  name: 'Video',
  mounted() {
    this.init();
  },
  methods:{
    init () {
      navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {
        const videoPlayer = document.querySelector("video");
        videoPlayer.srcObject = stream;
        videoPlayer.play()
      })
    }
  }
}
</script>
<style lang="scss" scoped>
  .camera {
    width: 100vw;
    height: 100vh;

    .feed {
      background-color: #171717;
      width: 100%;
      box-shadow: 4px 4px 12px 4px rgba(0,0,0,25);
    }
  }
</style>