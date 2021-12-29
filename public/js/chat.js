const socket = io();

// Elements
const messageForm = document.querySelector("#message-form");
const messageField = document.querySelector("#message-field");
const sendBtn = document.querySelector("#send-btn");
const sendLocationBtn = document.querySelector("#send-location");

const messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

const autoscroll = () => {
  // New Message element
  const newMessage = messages.lastElementChild;

  // Height of the new message element
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible Height
  const visibleHeight = messages.offsetHeight;

  // Height of messages container
  const containerHeight = messages.scrollHeight;

  // How far have I scrolled?
  // scrollbar height is equal to the visible height
  const scrollOffset = Math.ceil(messages.scrollTop) + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset + 1) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", (msg) => {
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format("h:mm a"),

    // createdAt: Intl.DateTimeFormat("en", {
    //   hour: "numeric",
    //   minute: "numeric",
    //   hour12: true,
    // }).format(new Date(msg.createdAt)),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (msg) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: msg.username,
    url: msg.url,
    createdAt: moment(msg.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  document.querySelector("#sidebar").innerHTML = html;
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Disable the send button
  sendBtn.disabled = true;

  const msg = messageField.value;

  // Send to backend
  msg &&
    socket.emit("sendMessage", msg, (error) => {
      if (error) {
        return console.log(error);
      }
    });

  // Clear the message field and bring focus to it; enable the send button
  messageField.value = "";
  messageField.focus();
  sendBtn.disabled = false;
});

sendLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Browser does not support this.");
  }
  // Disable the send location button
  sendLocationBtn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (location) => {
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      socket.emit("sendLocation", locationData, () => {
        console.log("Location shared!");

        // Enable the send location button
        sendLocationBtn.disabled = false;
      });
    },
    undefined,
    { enableHighAccuracy: true, maximumAge: 0 }
  );
});
