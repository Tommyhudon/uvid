import firebase from 'firebase'
import 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCblYN7aQXOK2JdCm4_iTefy-sI4GkUDG0",
  authDomain: "uvid-b030e.firebaseapp.com",
  databaseURL: "https://uvid-b030e.firebaseio.com",
  projectId: "uvid-b030e",
  storageBucket: "uvid-b030e.appspot.com",
  messagingSenderId: "326353836919",
  appId: "1:326353836919:web:05dc3b6515943f15979f72",
  measurementId: "G-WP0XVV38GE"
};
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();
const db = firebase.database();

export {
  db,
  firestore
}

