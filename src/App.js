import React from "react";
import "webrtc-adapter";
import flvjs from 'flv.js';


import { socket } from './socket';


class App extends React.Component {
  state = {
    startDisabled: false,
    offerDisabled: false,
    callDisabled: true,
    hangUpDisabled: true,
    servers: null,
    localStream: null,
    users: []
  };

  pc = null;

  localVideoRef = React.createRef();
  remoteVideoRef = React.createRef();

  connect = () => {
    this.pc = new RTCPeerConnection({
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy : "require"
    });

    this.pc.createOffer({
      offerToReceiveVideo: true
    })
      .then((offer) => {
        console.debug("createOffer sucess",offer);
        //We have sdp
        const sdp = offer.sdp;
        //Set it
        this.pc.setLocalDescription(offer);
        console.log(sdp);
        //Create room
        socket.emit('make-offer', JSON.stringify({
          cmd		: "OFFER",
          offer		: sdp
        }));
      })
      .catch(function(error){
        console.error("Error",error);
      });
  };

  componentDidMount () {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true
      })
      .then(this.gotStream)
      .catch(e => console.log("getUserMedia() error:" + e));

    socket.on('answer-made', (data) => {
      console.log(data);
    });

    var videoElement = document.getElementById('videoElement');
    var flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: 'ws://localhost:8000/live/test.flv'
    });
    flvPlayer.attachMediaElement(videoElement);
    flvPlayer.load();
    flvPlayer.play();
  }

  gotStream = stream => {
    this.localVideoRef.current.srcObject = stream;

    stream
      .getTracks()
      .forEach(track => this.pc.addTrack(track, stream));

    this.setState({
      callDisabled: false,
      localStream: stream
    });
  };

  render() {
    const { startDisabled, callDisabled, hangUpDisabled, offerDisabled } = this.state;

    return (
      <div>
        <video
          ref={this.localVideoRef}
          autoPlay
          muted
          style={{
            width: "240px",
            height: "180px"
          }}
        />{" "}
        <video
          ref={this.remoteVideoRef}
          autoPlay
          style={{
            width: "240px",
            height: "180px"
          }}
        />
        <video src="" id="videoElement" />
        <div>
          <button onClick={this.start2} disabled={startDisabled}>
            Start{" "}
          </button>{" "}
          <button onClick={this.connect} disabled={offerDisabled}>
            Call{" "}
          </button>{" "}
          <button onClick={this.hangUp} disabled={hangUpDisabled}>
            Hang Up{" "}
          </button>{" "}
        </div>{" "}

        {
          this.state.users.map((u) => {
            return <p key={u}>{u}</p>
          })
        }
      </div>
    );
  }
}

export default App;
