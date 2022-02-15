function countMembers(io, roomName) {

    // console.log(roomName)
    if(roomName !== undefined && roomName !== null && roomName !=='') {

        let roomData = io.sockets.adapter.rooms.get(roomName);

        if(roomData !== undefined && roomData !== null) {
            return io.sockets.adapter.rooms.get(roomName).size
        }
        return 0
    }
}

function getRoomList(io) {
    let rooms = io.sockets.adapter.rooms;
    let roomList = [];
    for (let _entry of rooms) {
        let name = _entry[0] // 키값
        let _value = _entry[1] // 데이터
        if (!_value.has(name)) { // 방이름과 같은 아이디가 포함되어있지않으면 만들어진 방이다.
            roomList.push(name);
        }
    }
    return roomList;
}

function getRoomUserList(io, roomName) {
    let users = io.sockets.adapter.rooms.get(roomName)

    // let userList=[]
    // for (let user of users) {
    //     userList.push(user);
    // }
    // return userList;

    //set,또는 map을 배열로 바꾸기
    // const serializedMap = [...myMap.entries()]; //map
    // const serializedSet = [...mySet.keys()];  //set

    // console.log(users)
    if(users !== undefined && users !== null) {

        return [...users.keys()]
    }
    return []
}


export {countMembers,getRoomList,getRoomUserList}
  