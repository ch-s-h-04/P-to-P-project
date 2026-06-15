# P2P Web Share

A direct browser-to-browser ephemeral file sharing application built with **React**, **Node.js**, **Socket.IO**, and native **WebRTC**. Files are transferred directly between peers without ever touching or storing data on an intermediate server.

---

## 1. Overview

**P2P Web Share** facilitates direct file transfers between two devices using a secure, zero-server-storage peer-to-peer data tunnel. 

### Real-World Use Case
When sharing sensitive documents, large media files, or installation packages, typical cloud storage options (e.g., Google Drive, Dropbox) introduce storage caps, upload/download speed throttling, and privacy concerns. **P2P Web Share** solves this by establishing a direct connection between the sender's and receiver's browsers. The moment the transfer is completed, all session traces are destroyed.

### Why WebRTC?
* **Direct Transfer:** WebRTC's `RTCDataChannel` allows the direct transmission of raw file bytes between browsers, bypassing server bandwidth bottlenecks.
* **Security:** All data channels are end-to-end encrypted by default via Datagram Transport Layer Security (DTLS).
* **Performance:** Leverages raw UDP/SCTP connections for maximum throughput and minimal overhead.
* **Privacy:** The signaling server only coordinates the connection; it never receives, parses, or stores the file contents.

Current implementation uses STUN servers and may fail under restrictive or symmetric NAT environments.

---

## Live Demo 

**Frontend:** <https://p-to-p-project-k7jug5ffp-ch-s-h-04s-projects.vercel.app/>

**Backend:** <https://p2p-signaling-server-suoj.onrender.com/>

---

## 2. Features

* **Direct Peer-to-Peer File Transfer:** Leverages native `RTCDataChannel` to achieve direct transmission of files.
* **Ephemeral Room Management:** Senders drag-and-drop a file to create a secure room ID (cryptographically generated using `nanoid`). Receivers can join instantly via a direct shareable URL or by inputting the room code.
* **Backpressure Management:** Monitors the data channel's `bufferedAmount` to prevent browser memory exhaustion and connection drops, pausing transmission until the buffer drains.
* **SHA-256 Integrity Verification:** Computes the cryptographic checksum of the file locally (using the Web Crypto API `crypto.subtle.digest`) on the sender side, and verifies it on the receiver side after chunk reassembly before triggering the download.
* **Dynamic Connection Monitoring:** Visual badges indicating the real-time state of the signaling socket, WebRTC PeerConnection, and RTCDataChannel.
* **Auto-Triggered Downloads:** Programmatic file downloads via anchor elements once the file reassembly and hash verification succeed.
* **TTL-based Room Eviction:** Backend automatically cleans up inactive rooms after a configurable time-to-live (`ROOM_TTL_MS`, defaulting to 10 minutes) using a background sweep.
* **Input Validation & Sanitization:** Server-side schema checks validate room actions, file metadata, and SDP payloads.
* **Progress Percentage Tracking:** Displays live progress percentage and transfer status (e.g., hashing, transferring, verifying, completed, failed) via Zustand store subscription.

---

## 3. System Architecture

The project consists of three distinct layers:
1. **Presentation / Application Layer (React & Zustand):** Handles UI views, drag-and-drop file picking, file chunking/hashing, and transfer status tracking.
2. **Signaling & Coordination Layer (Express & Socket.IO):** Relays session descriptions (SDP offers/answers) and ICE candidates.
3. **Transport Layer (WebRTC):** Direct peer-to-peer data transfer using secure `RTCDataChannel` with SCTP encapsulation.

```
       [ SENDER BROWSER ]                 [ SIGNALING SERVER ]                [ RECEIVER BROWSER ]
       
    1. Select file & calculate            2. Create & join room
       local SHA-256                      ─────────────────────>
                                          
    3. Generate SDP Offer                 4. Relay SDP Offer
       ───────────────────────────────────────────────────────────────>
                                                                         5. Set remote offer &
                                          6. Relay SDP Answer            generate SDP Answer
       <───────────────────────────────────────────────────────────────
       
    7. Set remote answer
    
    8. Exchange ICE Candidates            9. Relay ICE Candidates             10. Exchange ICE Candidates
       <===========================================> <===========================================>
       
                                         [ WEBRTC DATA CHANNEL ]
                                    (DTLS Encrypted Direct Connection)
                                    
                                          11. 16KB Chunks & Backpressure
                                          =============================>
                                          
                                          12. EOF Control Frame
                                          =============================>
                                                                         13. Reassemble Blob, compute 
                                                                             SHA-256 & verify hash
                                                                             
                                                                         14. Auto-trigger download
```

### Signaling Flow vs. Data Flow

* **Signaling Flow (via WebSocket):**
  * Senders emit `create-room` with file metadata (name, size, type, and hash).
  * The server replies with `room-created` and registers the room.
  * The receiver connects and emits `join-room`. The server returns `room-joined` (with file metadata) and notifies the sender via `peer-joined`.
  * The sender generates an SDP Offer and relays it via `signal:offer` to the server, which forwards it to the receiver.
  * The receiver generates an SDP Answer and relays it via `signal:answer` to the server, which forwards it to the sender.
  * Dynamic ICE Candidates are trickled via `signal:ice-candidate` through the server to complete the peer connection setup.

* **Data Flow (P2P DataChannel):**
  * The sender chunks the raw file into $16\text{ KB}$ ($16,384\text{ bytes}$) pieces.
  * Chunks are sent as binary `ArrayBuffer` payloads over the data channel.
  * Backpressure is managed: if the data channel's `bufferedAmount` exceeds $256\text{ KB}$, the sender waits for `onbufferedamountlow` before resuming.
  * Once all chunks are sent, the sender sends a JSON control frame: `{ type: "EOF" }`.
  * The receiver aggregates the binary chunks in memory.
  * Upon receiving the `EOF` message, the receiver compiles the chunks into a unified `Blob`, recalculates its SHA-256 checksum, compares it with the metadata hash, and triggers the browser download.

---

## 4. Tech Stack

| Component | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | `^18.3.1` | UI presentation layer |
| | Vite | `^5.2.11` | Dev tooling and build packager |
| | Zustand | `^4.5.2` | Ultra-fast state management with selector support |
| | Socket.IO Client | `^4.7.5` | Persistent signaling gateway client |
| | TailwindCSS | `^3.4.3` | Utility-first styling framework |
| | React Router DOM | `^6.23.1` | Single Page Application (SPA) client routing |
| **Backend** | Node.js | `>=18` | Server execution environment |
| | Express | `^4.19.2` | Core routing and middleware framework |
| | Socket.IO | `^4.7.5` | WebSocket server for signaling orchestration |
| | CORS | `^2.8.5` | Cross-origin resource sharing configuration |
| | express-rate-limit | `^7.2.0` | Basic rate-limiting on endpoints |
| | nanoid | `^5.0.7` | Cryptographically secure room identifier generator |
| **Networking**| WebRTC | Native | DataChannel peer-to-peer networking |
| | STUN | Native | NAT traversal address resolution (Google Public STUN) |
| **Deployment**| Vercel | Configured | Static hosting configuration (`vercel.json`) |
| | Render | Configured | Signaling server container hosting |

---

## 5. Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cors.js             # CORS configuration settings
│   │   │   └── env.js              # Environment variable loading & validation
│   │   ├── middleware/
│   │   │   ├── errorHandler.js     # Global HTTP error handler middleware
│   │   │   └── rateLimiter.js      # Endpoint rate limiter middleware
│   │   ├── routes/
│   │   │   ├── health.js           # API health status route
│   │   │   └── turn.js             # Ephemeral TURN credential generation route
│   │   ├── services/
│   │   │   ├── idGenerator.js      # Room code generator wrapper
│   │   │   ├── roomRegistry.js     # In-memory room tracking registry with expiration
│   │   │   └── turnCredentialService.js # Time-limited TURN HMAC credentials generator
│   │   ├── sockets/
│   │   │   ├── index.js            # Socket connection bootstrapping entrypoint
│   │   │   ├── presenceHandlers.js # Handles socket connection disconnect tracking
│   │   │   ├── roomHandlers.js     # Handles create, join, leave, and background cleanup
│   │   │   └── signalingHandlers.js# Relays SDP offers, answers, and ICE candidates
│   │   ├── validators/
│   │   │   └── socketPayloadSchemas.js # Schema-check structures for room and signaling events
│   │   └── server.js               # Application server bootstrap file
│   ├── .env.example                # Example backend env file
│   └── package.json                # Node backend packages configuration
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.jsx             # Root layout and theme wrapper
│   │   │   └── routes.jsx          # Declarative React Router layout
│   │   ├── components/
│   │   │   ├── ConnectionStatus/
│   │   │   │   └── ConnectionStatus.jsx # Real-time connection status badges
│   │   │   ├── DropZone/
│   │   │   │   ├── DropZone.jsx    # Drag-and-drop file interface
│   │   │   │   └── DropZone.module.css # Component-specific styles
│   │   │   ├── FileSummaryCard/
│   │   │   │   └── FileSummaryCard.jsx # File details metadata display
│   │   │   ├── JoinRoom/
│   │   │   │   └── JoinRoomForm.jsx # Room join submit form
│   │   │   ├── Notifications/
│   │   │   │   └── Toast.jsx       # Alert notification toast component
│   │   │   ├── RoomPanel/
│   │   │   │   └── RoomPanel.jsx   # Share link copy panel
│   │   │   └── TransferProgress/
│   │   │       ├── ProgressBar.jsx # Progress percentage bar
│   │   │       └── SpeedIndicator.jsx # Mock transfer speed panel
│   │   ├── hooks/
│   │   │   ├── useDataChannel.js   # Data channel lifecycle hook
│   │   │   ├── useFileHash.js      # Client-side file hashing utility
│   │   │   ├── useFileReceiver.js  # Buffer reassembly, EOF handler, and download trigger
│   │   │   ├── useFileSender.js    # Chunk reader, transmitter, and backpressure handler
│   │   │   ├── usePeerConnection.js# RTCPeerConnection instantiator & signaling event hooks
│   │   │   └── useSocket.js        # React wrapper connecting Socket.IO lifecycle
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Landing page dashboard
│   │   │   └── RoomPage.jsx        # File transfer transfer room page
│   │   ├── services/
│   │   │   ├── chunking.js         # File chunking helper utilities
│   │   │   ├── signalingClient.js  # Socket.IO connection singleton interface
│   │   │   └── webrtcConfig.js     # STUN servers and DataChannel default configuration
│   │   ├── store/
│   │   │   ├── connectionStore.js  # Socket, peer connection, and data channel states
│   │   │   ├── roomStore.js        # Current room, role, and file metadata states
│   │   │   ├── transferStore.js    # File hash, bytes transferred, speed, and status states
│   │   │   └── uiStore.js          # In-app toast alerts state slice
│   │   ├── utils/
│   │   │   ├── constants.js        # System limit and timeout constants
│   │   │   ├── formatBytes.js      # Byte size formatting function
│   │   │   └── idGenerator.js      # Client identifier generation helper
│   │   ├── index.css               # Global CSS entrypoint (imports Tailwind layers)
│   │   └── main.jsx                # SPA entrypoint
│   ├── index.html                  # Core HTML structure
│   ├── package.json                # Node frontend packages configuration
│   ├── tailwind.config.js          # Tailwind utility class directives
│   ├── vercel.json                 # Vercel single-page rewrite rules
│   └── vite.config.js              # Vite packaging config
├── README.md                       # Project documentation
├── architecture.md                 # System architecture overview
└── Mars_open_project_2026.pdf      # Base project design requirements document
```

---

## 6. Detailed Workflow

1. **File Selection:** Senders choose a file via the landing page's drag-and-drop or picker component (`DropZone.jsx`). The client calculates the file's SHA-256 checksum in the background using `crypto.subtle.digest`.
2. **Room Creation:** Senders call `createRoom` which emits `create-room` via `signalingClient`. The server creates an ephemeral room with `nanoid` (length 21), binds the file metadata (name, size, type, SHA-256 hash), joins the sender socket to that room, and returns `room-created` containing the `roomId`.
3. **Peer Joining:** Senders copy and share the link (`/room/:roomId`). When the receiver visits, they connect to the signaling server and trigger `join-room`. The server joins the receiver to the room, emits `room-joined` to the receiver (transmitting file metadata), and sends `peer-joined` to the sender socket.
4. **SDP Offer:** Receivers joining room signals to the sender (the connection initiator) that a peer is present. Senders call `createPeerConnection()`, instantiate a new `RTCDataChannel` named `fileTransfer` (with `ordered: true`), generate an SDP Offer (`createOffer()`), update their local session description, and emit `signal:offer` via the signaling socket.
5. **SDP Answer:** Receivers receive the SDP Offer via `offer-received` socket events, initialize their `RTCPeerConnection` instance, register the incoming data channel event listener (`ondatachannel`), set the remote description, create an SDP Answer (`createAnswer()`), update their local description, and emit `signal:answer` back. Senders catch the `answer-received` event and set the remote description.
6. **ICE Candidate Exchange:** Both clients gather connection pathways dynamically. As candidate paths are generated, `onicecandidate` event handlers emit candidates via `signal:ice-candidate` which the server forwards verbatim to the other peer via `ice-candidate-received`. Peers immediately add candidates using `addIceCandidate()`. If remote descriptions are not yet set, candidate updates are temporarily queued in `pendingCandidatesRef` and flushed afterwards.
7. **DataChannel Establishment:** The ICE agent succeeds, setting the connection state to `"connected"`. The sender's `RTCDataChannel` opens, triggering `dc.onopen`, which unlocks the chunk sender hook (`useFileSender.js`).
8. **Chunk Transfer:** Senders slice the file starting at offset 0 into $16\text{ KB}$ segments (`file.slice`). Chunks are loaded as `ArrayBuffer` items and passed to `dc.send(arrayBuffer)`. Senders track the buffer size: if `dc.bufferedAmount` exceeds $256\text{ KB}$ ($262,144\text{ bytes}$), senders pause slicing and wait for `dc.onbufferedamountlow` (set to trigger when the queue drops below $64\text{ KB}$) before sending subsequent chunks.
9. **EOF Signaling:** After all file segments are transmitted, senders send a JSON message: `JSON.stringify({ type: 'EOF' })` over the data channel. Senders then mark their transfer state as `completed`.
10. **File Reconstruction:** Receivers receive binary slices, pushing them into an in-memory array buffer list (`receivedChunks`), while updating their `bytesReceived` counter. Once they receive the string `'EOF'`, they construct a single cohesive file `Blob` using:
    ```javascript
    new Blob(receivedChunks, { type: fileMeta?.type || 'application/octet-stream' });
    ```
11. **SHA-256 Verification:** Receivers read the compiled `Blob` as an `ArrayBuffer` and compute its SHA-256 hash using:
    ```javascript
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    ```
    The computed hash is compared to the metadata hash received during the initial room join. The verification state (match/mismatch) is updated in `transferStore`.
12. **Download:** Receivers create a local object URL (`URL.createObjectURL(blob)`), dynamically append a temporary `<a>` anchor element, trigger `click()` programmatically, clean up the element, and revoke the object URL.

---

## 7. Environment Variables

### Frontend Environment Variables
These configurations must be set before building the static frontend application:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_SIGNALING_URL` | `https://p2p-signaling-server-suoj.onrender.com` | Primary signaling server WebSocket endpoint. |
| `VITE_BACKEND_URL` | `http://localhost:3000` | Alternative backend fallback URL utilized by the socket hooks. |
| `VITE_STUN_URLS` | `stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302` | Comma-separated list of STUN server URLs for gathering ICE candidates. |

### Backend Environment Variables
These configurations govern the operation of the Node/Express server:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Local port the HTTP server binds to. |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS whitelist of domains permitted to connect. |
| `TURN_SECRET` | `fallback_secret` | Secret key used to sign coturn credentials using HMAC-SHA1. |
| `TURN_SERVER_URL` | `turn:localhost:3478` | TURN server URL endpoint returned by the credentials API. |
| `ROOM_TTL_MS` | `600000` (10 minutes) | Expiry timer. Clean-up tasks remove rooms inactive longer than this value. |

---

## 8. Performance Notes

* **Chunk Size Configuration:** The codebase uses a chunk size of **$16\text{ KB}$ ($16,384\text{ bytes}$)**. This size is optimized to avoid exceeding browser-specific SCTP packet buffers and to prevent message fragmentation issues across different browsers.
* **Backpressure Controls:** To avoid memory thrashing and socket choking, the sender stops queueing chunks when `dc.bufferedAmount > 262144` bytes ($256\text{ KB}$). Senders resume transferring only when the queue falls below `dc.bufferedAmountLowThreshold` which is configured at `65536` bytes ($64\text{ KB}$).
* **Memory Limits:** File slices and incoming chunks are accumulated in the browser's system memory. To protect device stability, the application applies a strict file size cap of **$1\text{ GB}$ (`MAX_FILE_SIZE`)** defined in `utils/constants.js`.

---

## 9. Known Limitations

* **STUN-Only Frontend:** The frontend is configured with STUN servers only and does not query the backend's `/turn-credentials` endpoint or register TURN relay servers inside `RTCPeerConnection`.
* **Connectivity Restrictions:** Some carrier-grade NAT (CGNAT) and symmetric NAT environments may prevent peer connectivity since no TURN server is configured on the frontend.
* **Mock Presentation Elements:**
  * The `SpeedIndicator` component displays static placeholder values (`Speed: 12.4 MB/s` and `ETA: 00:00:15`) rather than calculating live averages from transfer state.
  * The `Toast` notification component serves as a visual scaffolding placeholder displaying static messages, instead of rendering active notifications from the `uiStore` state array.
  * The `useDataChannel.js` and `useFileHash.js` hooks contain mock log placeholders; the actual WebRTC data channel events and hash verifications are handled inline inside `usePeerConnection.js`, `useFileSender.js`, and `useFileReceiver.js`.
* **In-Memory Buffer Assembly:** Incoming files are buffered completely in browser memory before reassembly into a `Blob`. Transferring very large files (close to the 1GB threshold) on devices with limited RAM can cause browser tab crashes or memory allocation errors.
* **Single File Constraint:** The application's UI, hooks, and room stores are structured for 1-to-1 transfer of a single file per room session. Multiple files cannot be queued, transferred concurrently, or sent consecutively without resetting the session.

---

## 10. Future Improvements

* **Integrate Backend TURN Credentials:** Hook the frontend `usePeerConnection` into the backend `/turn-credentials` endpoint to fetch time-limited HMAC credentials dynamically, enabling traversal through symmetric NATs.
* **Disk-bound Streaming (OPFS):** Migrate from in-memory chunk arrays to the browser's **Origin Private File System (OPFS)** or **Streams API** to write incoming bytes directly to disk, allowing file sizes exceeding 1GB.
* **Dynamic Speed & ETA Calculations:** Compute rolling average throughput in `useFileSender` and `useFileReceiver` to replace the static indicators with real-time transfer stats.
* **Multi-File Queueing:** Adjust the room registry metadata and data channel control frames to allow folder transmission and bulk file queues in a single peer connection session.
* **Active UI Toast Dispatcher:** Bind the `Toast` component to the Zustand `uiStore` toast list, allowing the application to display error warnings, peer arrivals, and network drop notifications dynamically.

---

## 11. Deployment Guide

### Frontend Deployment (Vercel)
The client React app can be deployed easily on **Vercel** as a Single Page Application:
1. Connect your repository to Vercel.
2. Set the build configuration:
   * **Framework Preset:** Vite
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Add the following environment variables:
   * `VITE_SIGNALING_URL`: (The URL of your deployed backend)
   * `VITE_STUN_URLS`: `stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302`
4. Deploy. Vercel will process routing rewrites for SPA paths as configured in `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

### Backend Deployment (Render)
The signaling server can be deployed to **Render** as a Web Service:
1. Create a new Web Service on Render.
2. Link your repository.
3. Configure the build parameters:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. Set the environment variables:
   * `PORT`: `3000`
   * `ALLOWED_ORIGINS`: (Your deployed Vercel frontend URL, e.g. `https://your-app.vercel.app`)
   * `ROOM_TTL_MS`: `600000`
   * `TURN_SECRET`: (Generate a secure random string)
   * `TURN_SERVER_URL`: (Your coturn service URL if applicable)
5. Deploy. Ensure Render's web service doesn't trigger severe idle timeouts on WebSocket connections.

---

## 12. Screenshots Section

Below are visual design mockups of the P2P Web Share user interface (placeholders for when actual screenshots are added to the repository):

## Screenshots

## Screenshots

### Home Page
![Home Page](images/Home%20Page.png)

### Room Sharing Panel
![Room Sharing Panel](images/Room%20Sharing%20Panel.png)

### File Transfer & Verification Progress
![File Transfer & Verification Progress](images/File%20Transfer%20%26%20Verification%20Progress.png)

---

## 13. Testing

Validated through:
- Localhost testing
- Cross-browser testing
- Vercel + Render deployment testing
- File integrity verification using SHA-256 hashes

---


