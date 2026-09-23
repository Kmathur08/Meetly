import React from 'react'
const server_url = "https://localhost:8080";

var connections = {}

const peerConfigConnections = {
    "iceServers": [
        {"urls": "stun:stun.l.google.com:19302"},
    ]
}

export default function VideoMeet() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoRef = useRef();
    let [videoAvailable, setVideoAvilable] = useState(true);
    let [audioAvailable, setAudioAvilable] = useState(true);

    let [video,setVideo] = useState();
    let [audio,setAudio] = useState();
    let [screen,setScreen] = useState();
    let [showModal,setModal] = useState();
    let [screenAvailable,setScreenAvailable] = useState();
    let [messages,setMessages] = useState([]);
    let [message,setMessage] = useState("");;
    let [newMessages,setNewMessages] = useState(0);
    let [askForUsername,setAskForUsername] = useState(true);
    let [username,setUsername] = useState("");
    let[videos,setVideos] = useState([]);

    const videoRef = useRef([]);

    useEffect(() => {
        getPermissions();
    },[])

    useEffect(() => {
        if(videoAvailable || audioAvailable) {
            getUserMedia();
        }
    },[videoAvailable,audioAvailable]);

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        setScreen(screenAvailable);
        connectToSocketServer();
    }
    let getUserMedia = () => {
        if(video && videoAvailable || audio && audioAvailable) { 
            navigator.mediaDevices.getUserMedia({video:video,audio:audio})
            .then(getUserMediaSuccess)
            .then((stream) => {})
            .catch((err) => {
                console.log("Error while getting user media",err);
            })
        } else {
            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach((track) => track.stop())
            } catch(e) {}
        }
    }

    let getUserMediaSuccess = (stream) => {
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, {secure : false});
        socketRef.current.on('signal', gotMessageFromServer);
        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call",window.location.href)
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on("chat-message",addMessage);
            socketref.current.on("user-left",userLeft);
        })
    }
    const getPermissions = async () => {
        try {
            const videoPrmission = await navigator.mediaDevices.getUserMedia({video:true});
            if(videoPrmission) setVideoAvilable(true);
            else setVideoAvilable(false);

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio:true});
            if(audioPermission) setAudioAvilable(true);
            else setAudioAvilable(false);

            if(navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true);
            else setScreenAvailable(false);
        
            if(videoAvailable || audioAvailable) {
                const userMediaStream  = await navigator.mediaDevices.getUserMedia({video:videoAvailable,audio:audioAvailable});
            }

            if(userMediaStream) {
                window.localStream = userMediaStream;

                if(localVideoRef.current) {
                    localVideoRef.current.srcObject = userMediaStream;
                }
            }
        } catch (e) {
            console.log("Error while getting permissions",e);
        }
    }

  return (
    <div>
        {askForUsername === true ? 
            <div>
                <h2> Enter into the Meeting</h2>
                <TextField id = "outlined-basic" value = {username} label = "Enter your name" variant = "outlined" onChange={(e) => setUsername(e.target.value)} />
                <Button variant="contained" onClick={conect}>
                Connect
                </Button>

                <div>
                    <video ref={localVideoRef} autoPlay muted ></video>
                </div>
            </div> :
            <></>
        }
    </div>
  )
}
