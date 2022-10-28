import express from 'express'
import dotenv from "dotenv"
import https from 'https'
import http from 'http'
import fs from 'fs'
import SocketIO from "socket.io";

// import { doesNotMatch } from 'assert';


import { countMembers, getRoomUserList } from './utils/rooms'
import { userJoin, getCurrentUser, userLeave, getRoomUsers } from './utils/users'

// import SocketIO_version from "socket.io/package";

// console.log(SocketIO_version);
dotenv.config({ path: '.env' }); //환경 변수에 등록 
console.log(`run mode : ${process.env.NODE_ENV}`);

const app = express()

// app.use('/api/v1',fileControl);
// app.use('/', express.static('./tipAndTrick'));
// app.use('/media', express.static(`./media`));
// app.use('/webrtc', express.static(`./webrtc`));
app.use('/', express.static(`./public`));

// console.log(__dirname)

//순서 주의 맨 마지막에 나온다.
app.all('*', (req, res) => {
  res
    .status(404)
    .send('oops! resource not found')
});

let ioServer;
if (process.env.PROTOCOL === 'https') {
  //https 서버하고 연동시켜 실행시킵니다
  const options = {
    key: fs.readFileSync('/home/ubiqos/work/project/cert_files/2022_2/private.key'),
    cert: fs.readFileSync('/home/ubiqos/work/project/cert_files/2022_2/certificate.crt'),
    ca: fs.readFileSync('/home/ubiqos/work/project/cert_files/2022_2/ca_bundle.crt'),
  };
  // https 서버를 만들고 실행시킵니다
  const httpsServer = https.createServer(options, app)
  //socket io
  ioServer = SocketIO(httpsServer);
  console.log('https server is ready');
  httpsServer.listen(process.env.PORT, () => {
    console.log(`server run at :  ${process.env.PORT}`)
  });

}
else {
  //http 서버하고 연동시켜 실행시킵니다
  const httpServer = http.createServer(app)
  //socket io
  ioServer = SocketIO(httpServer);
  console.log('http server is ready');
  httpServer.listen(process.env.PORT, () => {
    console.log(`server run at :  ${process.env.PORT}`)
  });
}


ioServer.on("connection", (socket) => {

  console.log('connected', socket.id, socket.handshake.address);

  socket.onAny((eventName, evt) => {
    // ...
    console.log(`eventName: ${eventName}`, evt);
  });

  socket.on("login", (data, done) => {
    console.log(`login: ${data.name}`);
    userJoin({
      id: socket.id,
      username: data.name,
      room: '',
    });

    done({ r: 'ok' });
  });


  socket.on("enterRoom", (roomName, done) => {

    socket.join(roomName);

    getCurrentUser(socket.id).room = roomName; //입장 정보 갱신 

    let userCount = countMembers(ioServer, roomName)
    console.log(`${roomName} 의 유저 수 : ${userCount}`);

    if (userCount > 1) {
      console.log('join room', roomName, socket.id);

      let _user = getCurrentUser(socket.id)
      console.log(_user);
      //방참가 메씨지 전송 
      socket.to(roomName).emit('joinRoom', {
        userCount: userCount,
        user: _user,
      }); //자신이 아닌 다른 사람에게만 보내기
    }
    else {
      console.log('create room', roomName, socket.id);
      socket.emit('created', roomName, socket.id); //자신에게만 보내기 
    }

    // console.log(socket.rooms)

    done({
      roomName: roomName,
      userCount: userCount
      // socket : socket
    });
  });

  socket.on("reqRoomList", (done) => {
    done({
      roomList: getRoomList(ioServer)
    });
  });

  socket.on("reqRoomInfo", (roomName, done) => {

    // console.log(roomName)
    let userCount = countMembers(ioServer, roomName)
    // console.log(`${roomName} 의 유저 수 : ${userCount}`);

    done({
      roomName: roomName,
      userCount: userCount,
      roomUserList: getRoomUserList(ioServer, roomName)
    });
  });



  socket.on("leaveRoom", (roomName) => {
    console.log('leave room', roomName, socket.id);
    socket.leave(roomName);

    socket.to(socket.room).emit('leaveRoom', {
      userId: socket.id,
      roomName: socket.room,
      userCount: countMembers(ioServer, socket.room)
    });
  });

  socket.on("disconnect", () => {
    console.log('disconnect', socket.id);

    // console.log(socket);
    let rooms = ioServer.sockets.adapter.rooms;

    // console.log(rooms);
    // let roomList = [];

    for (let _entry of rooms) { //멤구조 순회 
      let name = _entry[0] //키값
      let _value = _entry[1] // 데이터 

      if (_value.has(socket.id)) { //방이름과 같은 아이디가 포함되어있지않으면 만들어진 방이다.
        // roomList.push(name);
        console.log(name)
      }
    }

    ioServer.emit('disconnectUser', {
      userId: socket.id
    });
  });

  socket.on("message", (roomName, message) => {
    console.log('message', roomName, message);
    socket.to(roomName).emit('message', {
      msg: message,
      at: new Date(),
      user: getCurrentUser(socket.id)
    });
  });


});



