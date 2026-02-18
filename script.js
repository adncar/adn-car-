// ----------------------
// CONFIGURACIÓN FIREBASE
// ----------------------
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ----------------------
// SELECTOR DE IDIOMA
// ----------------------
const langSelect = document.getElementById("langSelect");
const texts = {
  es: { title: "Doctor Auto", authTitle: "Registrarse / Iniciar sesión", chatTitle: "Chat", email: "Email", password: "Contraseña", send: "Enviar", record: "🎤 Grabar Audio", stop: "⏹ Detener" },
  en: { title: "Doctor Auto", authTitle: "Sign Up / Login", chatTitle: "Chat", email: "Email", password: "Password", send: "Send", record: "🎤 Record Audio", stop: "⏹ Stop" }
};

langSelect.addEventListener("change", () => {
  const lang = langSelect.value;
  document.getElementById("title").textContent = texts[lang].title;
  document.getElementById("authTitle").textContent = texts[lang].authTitle;
  document.getElementById("chatTitle").textContent = texts[lang].chatTitle;
  document.getElementById("email").placeholder = texts[lang].email;
  document.getElementById("password").placeholder = texts[lang].password;
  document.getElementById("sendBtn").textContent = texts[lang].send;
  document.getElementById("recordBtn").textContent = texts[lang].record;
  document.getElementById("stopBtn").textContent = texts[lang].stop;
});

// ----------------------
// AUTENTICACIÓN
// ----------------------
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

registerBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(user => alert("Registrado con éxito!"))
    .catch(err => alert(err.message));
});

loginBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => alert(err.message));
});

logoutBtn.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("chatSection").style.display = "block";
    logoutBtn.style.display = "block";
    loadMessages();
  } else {
    document.getElementById("authSection").style.display = "block";
    document.getElementById("chatSection").style.display = "none";
    logoutBtn.style.display = "none";
  }
});

// ----------------------
// CHAT DE TEXTO
// ----------------------
const sendBtn = document.getElementById("sendBtn");
sendBtn.addEventListener("click", sendMessage);

function sendMessage() {
  const message = document.getElementById("messageInput").value;
  const user = auth.currentUser.email;
  if (message) {
    db.collection("messages").add({ user, message, timestamp: Date.now(), type: "text" });
    document.getElementById("messageInput").value = "";
  }
}

function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  db.collection("messages").orderBy("timestamp").onSnapshot(snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === "text") {
        messagesDiv.innerHTML += <p><strong>${data.user}:</strong> ${data.message}</p>;
      } else if (data.type === "audio") {
        messagesDiv.innerHTML += <p><strong>${data.user}:</strong> <audio controls src="${data.url}"></audio></p>;
      }
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
  });
}

// ----------------------
// CHAT DE AUDIO
// ----------------------
let mediaRecorder;
let audioChunks = [];

const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");

recordBtn.addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();
  audioChunks = [];

  mediaRecorder.addEventListener("dataavailable", e => audioChunks.push(e.data));
  mediaRecorder.addEventListener("stop", async () => {
    const audioBlob = new Blob(audioChunks);
    const user = auth.currentUser.email;
    const fileRef = storage.ref().child(audios/${Date.now()}_${user}.webm);
    await fileRef.put(audioBlob);
    const url = await fileRef.getDownloadURL();
    await db.collection("messages").add({ user, url, timestamp: Date.now(), type: "audio" });
  });

  recordBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener("click", () => {
  mediaRecorder.stop();
  recordBtn.disabled = false;
  stopBtn.disabled = true;
});
