let peerConnection;
let localStream;
let connection;

async function initializeConnection() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl('/streamhub')
        .build();

    connection.on('receiveOffer', async (offer) => {
        console.log('Offer received from server:', offer);
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            connection.invoke('sendAnswer', answer);
            console.log('Answer created and sent to server:', answer);
        } catch (err) {
            console.error('Error handling received offer:', err);
        }
    });

    connection.on('receiveAnswer', async (answer) => {
        console.log('Answer received from server:', answer);
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
            console.error('Error handling received answer:', err);
        }
    });

    connection.on('receiveCandidate', async (candidate) => {
        console.log('Candidate received from server:', candidate);
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error('Error adding received candidate:', err);
        }
    });

    connection.onclose(async () => {
        console.log('SignalR connection closed. Reconnecting...');
        await startLiveStream();  // Reconnect
    });

    await connection.start();
    console.log('SignalR connection established.');
}

async function initializePeerConnection(isStarter) {
    if (peerConnection) {
        peerConnection.close();
    }

    peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('New ICE candidate:', event.candidate);
            connection.invoke('sendCandidate', event.candidate).catch((err) => {
                console.error('Error sending candidate:', err);
            });
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed') {
            console.error('ICE connection failed');
        }
    };

    peerConnection.ontrack = (event) => {
        console.log('Remote track received:', event.streams[0]);
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo.srcObject !== event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
            console.log('Remote stream set on remoteVideo element.');
        }
    };

    if (isStarter) {
        peerConnection.onnegotiationneeded = async () => {
            console.log('Negotiation needed');
            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                connection.invoke('sendOffer', offer).catch((err) => {
                    console.error('Error sending offer:', err);
                });
                console.log('Offer created and sent to server:', offer);
            } catch (err) {
                console.error('Error during negotiation:', err);
            }
        };

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
            const localVideo = document.getElementById('localVideo');
            localVideo.srcObject = localStream;
            localVideo.style.display = 'block';
            console.log('Local stream set and video element updated.');
        } catch (err) {
            console.error('Error accessing user media:', err);
        }
    }
}

async function startLiveStream() {
    try {
        if (!connection) {
            await initializeConnection();
        }
        await initializePeerConnection(true);
    } catch (err) {
        console.error('Error starting live stream:', err);
    }
}

async function joinLiveStream() {
    try {
        if (!connection) {
            await initializeConnection();
        }
        await initializePeerConnection(false);
    } catch (err) {
        console.error('Error joining live stream:', err);
    }
}

document.getElementById('startButton').addEventListener('click', startLiveStream);
document.getElementById('joinButton').addEventListener('click', joinLiveStream);

window.onerror = function (message, source, lineno, colno, error) {
    console.error('Error:', message, 'at', source, lineno + ':' + colno, 'error object:', error);
};
