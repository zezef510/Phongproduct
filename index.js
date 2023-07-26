const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'sockett'
});

// set up routes and middleware
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/web.html');
});

// listen for incoming connections from clients
io.on('connection', (socket) => {
    console.log('a user connected');

    // handle user registration
    socket.on('register', (userData) => {
        const { name, email, password } = userData;
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        pool.query(query, [name, email, password], (error, results) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log('User registered:', name);
            socket.emit('message', 'User registered: ' + name);
        });
    });

    // handle user login
    socket.on('login', (userData) => {
        const { email, password } = userData;
        const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
        pool.query(query, [email, password], (error, results) => {
            if (error) {
                console.error(error);
                return;
            }
            if (results.length > 0) {
                const user = results[0];
                console.log('User logged in:', user.name);
                socket.emit('message', 'User logged in: ' + user.name);
            } else {
                console.log('Invalid credentials');
                socket.emit('message', 'Invalid credentials');
            }
        });
    });

    // handle incoming messages from clients
    socket.on('message', (msg) => {
        console.log('message: ' + msg);
        // broadcast the message to all clients
        io.emit('message', msg);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
