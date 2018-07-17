import React, { Component } from 'react';
import './App.css';

import { socket } from './socket';

let pc;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      users : [],
    }
  }

  componentDidMount () {
    const answersFrom = {};
    pc = new window.RTCPeerConnection({
      iceServers : [
        {
          urls : ["stun:stun.l.google.com:19302"],
        },
        {
          urls: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        },
      ]
    });

    pc.oniceconnectionstatechange = function(){
      console.log('ICE state: ', pc.iceConnectionState);
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log(stream);
        const video = document.querySelector('video');
        video.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      }).catch((err) => {
      console.log(err);
    });

    pc.ontrack = this.addStream;

    socket.on('answer-made', async (data) => {
      try {
        console.log('ans', data);
        await pc.setRemoteDescription(data.answer);
        if (!answersFrom[data.socket]) {
          this.createOffer(data.socket);
          answersFrom[data.socket] = true;
        }
      } catch (e) {
        console.log(e);
      }
    });

    socket.on('offer-made', async (data) => {
      try {
        console.log(data);
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('make-answer', {
          answer: answer,
          to: data.offer,
        });
      } catch (err) {
        console.log(data);
        console.log(err);
      }
    });

    socket.on('add-users', (data) => {
      this.setState({
        users: data.users,
      });
    });

    socket.on('remove-user', (id) => {
      const users = this.state.users;
      users.splice(users.indexOf(id), 1);
      this.setState({users});
    });
  }

  createOffer = (id) => async () => {
    console.log(id);
    const offer = await pc.createOffer();
    console.log(offer);
    await pc.setLocalDescription(offer);
    socket.emit('join', id);
    socket.emit('make-offer', {
      offer,
      to : id
    });
  };

  addStream = (obj) => {
    console.log(obj);
    console.log(obj.streams[0]);
    this.video.srcObject = obj.streams[0];
    const video = document.querySelector('#video2');
    video.srcObject = obj.streams[0];

    setTimeout(() => {
      this.setState({hola : 'juuuuu'});
    }, 4000)

  };

  render() {
    console.log('render');
    return (
      <div className="App">
        <div className="container">
          <video className="video-large" autoPlay />
          <video id="video2" ref={video => this.video = video} className="video-large" autoPlay />
          <div className="users-container" id="users-container">
            <h4>Users</h4>
            {
              this.state.users.map(u => {
                console.log(u);
                return (
                  <button key={u} onClick={this.createOffer(u)}>{u}</button>
                )
              })
            }
          </div>
        </div>
      </div>
    );
  }
}

export default App;
