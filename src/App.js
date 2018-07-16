import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { subscribeToTimer, socket } from './socket';

const peerConnection = window.RTCPeerConnection;

const sessionDescription = window.RTCSessionDescription;

const pc = new peerConnection({
  iceServers : [
    {
      urls       : "turn:turnserver.example.org",
      username   : "webrtc",
      credential : "turnpassword"
    }
  ]
});

class App extends Component {
  constructor(props) {
    super(props);

    subscribeToTimer((err, timestamp) => this.setState({
      timestamp
    }));
  }

  render() {
    const answersFrom = {};
    let offer = '';

    pc.onaddstream = function(obj) {
      console.log('add stream')
      const vid = document.createElement('video');
      vid.setAttribute('class', 'video-small');
      vid.setAttribute('autolay', 'autolay');
      vid.setAttribute('id', 'video-small');
      document.getElementById('users-container').appendChild(vid);
      vid.src = window.URL.createObjectURL(obj.stream);
    };

    pc.onaddtack = function(obj) {
      console.log('add stream')
      const vid = document.createElement('video');
      vid.setAttribute('class', 'video-small');
      vid.setAttribute('autolay', 'autolay');
      vid.setAttribute('id', 'video-small');
      document.getElementById('users-container').appendChild(vid);
      vid.src = window.URL.createObjectURL(obj.stream);
    };

    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then(function(stream) {
        console.log(stream);
        var video = document.querySelector('video');
        video.src = window.URL.createObjectURL(stream);
        pc.addStream(stream);
      }).catch((err) => {
      console.log(err);
    });

    function createOffer(id) {
      pc.createOffer(function(offer) {
        pc.setLocalDescription(new sessionDescription(offer), function() {
          socket.emit('make-offer', {
            offer: offer,
            to: id
          });
        }, function (err) {
          console.log(err);
        });
      }, function (err) {
        console.log(err);
      });
    }

    socket.on('answer-made', function(data) {
      pc.setRemoteDescription(new sessionDescription(data.answer)).then(() => {
        document.getElementById(data.socket).setAttribute('class', 'active');
        if (!answersFrom[data.socket]) {
          createOffer(data.socket);
          answersFrom[data.socket] = true;
        }
      });
    });

    socket.on('offer-made', function(data) {
      offer = data.offer;

      pc.setRemoteDescription(new sessionDescription(data.offer), function() {
        pc.createAnswer(function(answer) {
          pc.setLocalDescription(new sessionDescription(answer), function() {
            socket.emit('make-answer', {
              answer: answer,
              to: data.socket
            });
          }, function (err) {
            console.log(err);
          });
        }, function (err) {
          console.log(err);
        });
      }, function (err) {
        console.log(err);
      });
    });

    socket.on('add-users', function(data) {
      for (var i = 0; i < data.users.length; i++) {
        var el = document.createElement('div'),
          id = data.users[i];

        el.setAttribute('id', id);
        el.innerHTML = id;
        el.addEventListener('click', function() {
          createOffer(id);
        });
        document.getElementById('users').appendChild(el);
      }
    });

    socket.on('remove-user', function(id) {
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
