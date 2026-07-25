import { useNavigate } from 'react-router';
import { getJWTPayload } from './jwt';

function Login(props) {
  const navigate = useNavigate();

  async function getUserId(jwt) {
    console.log(getJWTPayload(jwt));
    var payload = JSON.parse(getJWTPayload(jwt));
    
    return payload.sub;
  }

  async function sendLogin(e) {
    e.preventDefault();
    var email = document.getElementById("loginEmail").value;
    var pw = document.getElementById("loginPw").value;

    let fetchPromise = fetch('http://localhost:8080/login', {
      method: 'POST', 
      mode:   'cors',
      headers: {
        "Content-Type": "application/json",
        "X-PINGOTHER": "pingpong",
      },
      body: "{\"email\": \""+email+"\",\"pw\": \""+pw+"\" }"
    });

    fetchPromise
    .then( (res) => {
      if (!res.ok) { return; } 
      res.text().then( (value) => {
        props.saveJWT(value);
        getUserId(value).then( (id) => {
          props.saveUserId(id);
          navigate('/', true);
        });
      });
    });
  }
  return (
    <div className="" id="login">
      <input className="m-2" name="loginEmail" id="loginEmail"></input>
      <input className="m-2" type="password" name="loginPw" id="loginPw"></input>
      <button className="m-2 p-2" onClick={sendLogin}>Login</button>
    </div>
  )
}

export default Login;
