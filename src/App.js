import React from "react";
import "webrtc-adapter";

import { socket } from './socket';

// copied from common.js https://github.com/webrtc/samples/blob/gh-pages/src/js/common.js
function trace(arg) {
  var now = (window.performance.now() / 1000).toFixed(3);
  console.log(now + ": ", arg);
}

class App extends React.Component {
  state = {
    startDisabled: false,
    offerDisabled: false,
    callDisabled: true,
    hangUpDisabled: true,
    servers: null,
    pc1: null,
    pc2: null,
    localStream: null,
    users: []
  };

  pc = null;
  pc3 = null;

  localVideoRef = React.createRef();
  remoteVideoRef = React.createRef();

  componentDidMount () {
    socket.on('added', (data) => {
      this.setState({
        users : data.clients,
        host  : data.host,
      })
    });

    socket.on('me', (data) => {
      console.log(data);
      this.setState({
        host : data.host,
        me   : data.me,
      })
    })

    socket.on('candidate', (data) => {
      console.log(data);
      console.log('holaaaa');
      console.log('holaaaa');
      this.pc.addIceCandidate(data.candidate)
    })

    socket.on('offer-made', (data) => {
      console.log('offer made', data.offer);
      let { pc1 } = this.state;
      this.pc.setRemoteDescription(data.offer).then(() => {
        console.log("pc1 setRemoteDescription complete createOffer")
        this.pc.createAnswer().then((ans) => {
          console.log('asn', ans)
          this.pc.setLocalDescription(ans);
          socket.emit('make-answer', {
            answer : ans,
            to     : data.socket,
          })
        })
      }).catch((err) => console.log(err));
    })

    socket.on('answer-made', (data) => {
      console.log('ans made', data);
      let { pc1 } = this.state;
      this.pc.setRemoteDescription(data.answer);
    })
  }

  createRoom = () => {
    console.log(this.state.users);
    const host = this.state.users.length === 0;
    socket.emit('join', { room : 'test', isHost : host });

    this.setState({
      startDisabled : true,
      offerDisabled : host,
    })
  };

  joinRoom = () => {
    socket.emit('join', { room : 'test', isHost : false });
  };

  start2 = () => {
    this.createRoom();
    this.setState({
      startDisabled: true
    });
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true
      })
      .then(this.gotStream)
      .catch(e => alert("getUserMedia() error:" + e.name));

    let servers = null;
    let servers2 = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302"
        }
      ]
    };
    this.pc = new RTCPeerConnection(servers2);

    this.pc.onicecandidate = e => this.onIceCandidate2(this.pc, e);
    this.pc.oniceconnectionstatechange = e => this.onIceStateChange(this.pc, e);
    this.pc.ontrack = this.gotRemoteStream;
  };


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


  gotRemoteStream = event => {
    console.log(event);
    let remoteVideo = this.remoteVideoRef.current;

    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  createOffer = () => {
    this.setState({
      callDisabled: true,
      hangUpDisabled: false
    });

    this.pc
      .createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      })
      .then(this.onCreateOfferSuccess2, error =>
        console.error(
          "Failed to create session description",
          error.toString()
        )
      );

    console.log("servers after call");
  };
  onCreateOfferSuccess2 = desc => {
    this.pc
      .setLocalDescription(desc)
      .then(() => {
        console.log('sending local desc:');
        socket.emit('make-offer', {
          offer: desc,
          to : this.state.host,
        });
        console.log("pc1 setLocalDescription complete createOffer");
      }).catch((error) => {
      console.error(
        "pc1 Failed to set session description in createOffer",
        error.toString()
      )
    })
  };


  onIceCandidate2 = (pc, event) => {
    console.log(event);
    console.log('jjooooo');
    const to = this.state.users.filter((u) => this.state.me !== u);
    socket.emit('new-candidate', {
      candidate: event.candidate,
      to : to[0],
    });
  };

  onIceStateChange = () => {
    console.log("ICE state:", this.pc.iceConnectionState);
  };

  hangUp = () => {

    this.pc.close();

    this.setState({
      pc1: null,
      pc2: null,
      hangUpDisabled: true,
      callDisabled: false
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
        <div>
          <button onClick={this.start2} disabled={startDisabled}>
            Start{" "}
          </button>{" "}
          <button onClick={this.createOffer} disabled={offerDisabled}>
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