import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { socket } from './socket';

const pc = new window.RTCPeerConnection({
  iceServers : [
    {
      urls : "stun:stun.l.google.com:19302",
    }
  ]
});

class App extends Component {
  constructor(props) {
    super(props);
  }

  createOffer = async (id) => {
    console.log(id);
    const offer = await pc.createOffer();
    console.log(offer);
    await pc.setLocalDescription(offer);
    socket.emit('make-offer', {
      offer,
      to : id
    });
  };

  render() {
    const answersFrom = {};
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((stream) => {
        console.log(stream);
        const audio = document.querySelector('audio');
        audio.srcObject = stream;
        pc.addStream(stream);
      }).catch((err) => {
      console.log(err);
    });

    socket.on('answer-made', (data) => {
      pc.setRemoteDescription(data.answer).then(() => {
        document.getElementById(data.socket).setAttribute('className', 'active');
        if (!answersFrom[data.socket]) {
          this.createOffer(data.socket);
          answersFrom[data.socket] = true;
        }
      });
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
      for (let i = 0; i < data.users.length; i++) {
        const el = document.createElement('div');
        const id = data.users[i];

        el.setAttribute('id', id);
        el.innerHTML = id;
        el.addEventListener('click', () => {
          this.createOffer(id);
        });
        document.getElementById('users').appendChild(el);
      }
    });

    socket.on('remove-user', (id) => {
      const div = document.getElementById(id);
      document.getElementById('users').removeChild(div);
    });

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div className="container">
          <video className="video-large" autoPlay />
          <audio className="video-large" autoPlay controls />
          <div className="users-container" id="users-container">
            <h4>Users</h4>
            <div id="users"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
