import express from 'express'
import dotenv from "dotenv"
import https from 'https'
import fs from 'fs'
import SocketIO from "socket.io";
// import SocketIO_version from "socket.io/package";

// console.log(SocketIO_version);
dotenv.config({ path: '.env' }); //환경 변수에 등록 
console.log(`run mode : ${process.env.NODE_ENV}`);

const app = express()

// app.use('/api/v1',fileControl);
app.use('/tipAndTrick', express.static('./tipAndTrick'));
app.use('/media', express.static(`./media`));
app.use('/webrtc', express.static(`./webrtc`));
app.use('/', express.static(`./public`));

// console.log(__dirname)

//순서 주의 맨 마지막에 나온다.
app.all('*', (req, res) => {
  res
    .status(404)
    .send('oops! resource not found')
});

//https 서버하고 연동시켜 실행시킵니다
const options = {
  key: fs.readFileSync('/home/ubiqos/work/project/cert_files/2022_2/private.key'),
  cert: fs.readFileSync('/home/ubiqos/work/project/cert_files/2022_2/certificate.crt'),
  ca: fs.readFileSync('/home/ubiqos/work/project/cert_files/2022_2/ca_bundle.crt'),
};
// https 서버를 만들고 실행시킵니다
const httpsServer = https.createServer(options, app)

//socket io
const ioServer = SocketIO(httpsServer);

function countMembers(io,roomName) {
    return io.sockets.adapter.rooms.get(roomName).size
}

ioServer.on("connection", (socket) => {

  console.log('connected', socket.id, socket.handshake.address);

  
  socket.on("enterRoom", (roomName) => {
    
    socket.join(roomName);

    console.log('usercount : ', countMembers(roomName));

    if(countMembers(roomName) < 2) {
      console.log('create room', roomName, socket.id);
      socket.emit('created', roomName, socket.id);
    }
    else {
      console.log('join room', roomName, socket.id);
      socket.to(roomName).emit('join', roomName, socket.id);
    }
  });

  socket.on("leaveRoom", (roomName) => {
    console.log('leave room', roomName, socket.id);
    socket.leave(roomName);
    socket.to(roomName).emit('leave', roomName, socket.id);
  });

  socket.on("disconnect", () => {
    console.log('disconnect', socket.id);
    socket.to(socket.room).emit('leave', socket.room, socket.id);
  });

  socket.on("message", (roomName, message) => {
    console.log('message', roomName, message);
    socket.to(roomName).emit('message', roomName, message);
  });
  

});

httpsServer.listen(process.env.PORT, () => {
  console.log(`server run at : ${process.env.PORT}`)
});


