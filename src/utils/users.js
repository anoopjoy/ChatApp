const users = [];

const addUser = (id, username, room) => {
  // Clean the data
  username = username?.trim().toLowerCase();
  room = room?.trim().toLowerCase();

  // Username and room both are required
  if (!username || !room) {
    return { error: "Username and Room are required!" };
  }

  // Check for an existing user
  const existingUser = users.find(
    (user) => user.username === username && user.room === room
  );

  if (existingUser) {
    return { error: "Username already in use!" };
  }

  // Add the user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const userIdx = users.findIndex((user) => user.id === id);

  if (userIdx !== -1) {
    return users.splice(userIdx, 1)[0];
  }
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room.trim().toLowerCase());
};

module.exports = { addUser, removeUser, getUser, getUsersInRoom };
