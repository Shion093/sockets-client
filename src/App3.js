import React, { Component } from 'react';
import './App.css';

import { socket } from './socket';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      users : [],
      rooms : [],
    }

    this.canvas = React.createRef();
  }


  componentDidMount () {
    navigator.mediaDevices.getUserMedia({ video : true, audio : true })
      .then((stream) => {
        console.log(stream);
        const video = document.querySelector('video');
        video.srcObject = stream;
      }).catch((err) => {
      console.log(err);
    });

    socket.on('added', async (data) => {
      try {
        console.log('ans', data);
      } catch (e) {
        console.log(e);
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

    this.createRoom();
  }

  createOffer = () => {
    const video = document.getElementById('sourcevid');
    const backcontext = this.canvas.current.getContext('2d');

    const cw = video.clientWidth;
    const ch = video.clientHeight;
    this.canvas.current.width = cw;
    this.canvas.current.height = ch;
    this.draw(video, backcontext, cw, ch);
  };

  draw = (v, bc, w, h) => {
    bc.drawImage(v, 0, 0, w, h);

    const stringData = this.canvas.current.toDataURL();

    socket.emit('make-answer', {
      video: stringData,
    });

    setTimeout(() => { this.draw(v, bc, w, h) });
  };


  createRoom = () => {
    socket.emit('join', 'test');
  };

  render() {
    console.log('render');
    return (
      <div className="App">
        <div className="container">
          <video autoPlay id="sourcevid"/>
          <canvas id="output"/>
          <canvas id="stream" ref={this.canvas}/>
          <div id="log"/>
          <div className="users-container" id="users-container">
            <button onClick={this.createRoom}>Create Room</button>
            <button onClick={this.createOffer}>Create Offer</button>
            <h4>Users</h4>
            {
              this.state.users.map(u => {
                console.log(u);
                return (
                  <button key={u}>{u}</button>
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
