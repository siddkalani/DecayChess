# DecayCheese 🍕♟️

A modern chess application built with React Native (Expo) for the frontend and Node.js/Express for the backend. Features real-time multiplayer chess games, tournaments, leaderboards, and various game modes.

## 🚀 Features

- **Real-time Multiplayer Chess** - Play against other players with WebSocket connections
- **Multiple Game Variants** - Classic chess, Crazy House, and more
- **Tournament System** - Participate in scheduled tournaments
- **Leaderboards** - Track your progress and compete with others
- **User Authentication** - Secure login and registration
- **Match Making** - Find opponents with similar skill levels
- **Time Controls** - Various time formats for different game speeds
- **Cross-Platform** - Available on iOS, Android, and Web

## 🛠️ Tech Stack

### Frontend (Client)
- **React Native** with Expo
- **TypeScript**
- **Expo Router** for navigation
- **NativeWind** (TailwindCSS for React Native)
- **Socket.IO Client** for real-time communication
- **Axios** for API calls

### Backend (Server)
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for real-time features
- **Redis** for session management
- **JWT** for authentication
- **Chess.js** for game logic
- **Node-cron** for scheduled tasks

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Redis** server
- **Expo CLI** (`npm install -g @expo/cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/codewithswatiee/chessNCheese.git
cd chessNCheese
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### Configure Environment Variables

Edit the `.env` file in the server directory:

```properties
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/Chess
SECRET_KEY=your_secret_key_here
```

#### Start Required Services

**MongoDB:**
- Install MongoDB locally or use MongoDB Atlas
- Ensure MongoDB is running on the specified URI

**Redis:**
- Install Redis locally
- Start Redis server: `redis-server`

#### Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will be running on `http://localhost:3000`

### 3. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Start the Expo development server
npm start
```

#### Running on Different Platforms

```bash
# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on Web
npm run web
```

## 📱 Development Workflow

### Backend Development

1. **Start MongoDB and Redis services**
2. **Run the backend server:**
   ```bash
   cd server
   npm run dev
   ```

### Frontend Development

1. **Start the Expo development server:**
   ```bash
   cd client
   npm start
   ```

2. **Choose your platform:**
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for Web

## 🏗️ Project Structure

```
chessNCheese/
├── client/                 # React Native frontend
│   ├── app/               # Expo Router pages
│   │   ├── (auth)/        # Authentication screens
│   │   ├── (game)/        # Game-related screens
│   │   └── (main)/        # Main app screens
│   ├── components/        # Reusable components
│   ├── lib/              # Utilities and services
│   └── assets/           # Images, fonts, etc.
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── router/           # API routes
│   ├── middlewares/      # Express middlewares
│   ├── validations/      # Game validation logic
│   └── Websockets/       # Socket.IO handlers
```

## 🎮 Game Features

### Game Modes
- **Classic Chess** - Traditional chess rules
- **Time Controls** - Bullet, Rapid formats
- **Tournament Mode** - Competitive tournaments
- **Variants** - Different chess variants

### Real-time Features
- Live game updates via WebSocket
- Real-time chat during games
- Live leaderboard updates
- Tournament notifications

## 🔧 Configuration

### MongoDB Configuration
Ensure your MongoDB instance is running and accessible via the URI specified in your `.env` file.

### Redis Configuration
Redis is used for session management and real-time features. Make sure Redis server is running.

### Expo Configuration
The app uses Expo for cross-platform development. Check `app.json` for Expo-specific configurations.

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 📦 Building for Production

### Backend Deployment
```bash
cd server
npm start
```

### Frontend Build
```bash
cd client
# Build for production
expo build:android
expo build:ios
expo build:web
```

## 🚀 Deployment

### Backend
- Deploy to services like Heroku, Railway, or DigitalOcean
- Ensure MongoDB and Redis are accessible from production
- Set production environment variables

### Frontend
- Use Expo Application Services (EAS) for mobile builds
- Deploy web version to Vercel, Netlify, or similar platforms

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Swati** - [codewithswatiee](https://github.com/codewithswatiee)

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check the connection URI in `.env`

2. **Redis Connection Error**
   - Start Redis server: `redis-server`
   - Verify Redis is running on default port 6379

3. **Expo Metro Bundle Failed**
   - Clear Expo cache: `expo r -c`
   - Restart the development server

4. **Socket Connection Issues**
   - Ensure backend server is running
   - Check firewall settings
   - Verify the correct server URL in client configuration

### Performance Tips

- Use Redis for caching frequently accessed data
- Implement database indexing for faster queries
- Optimize chess game state updates
- Use React Native performance profiling tools

## 🔗 Useful Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Chess.js Library](https://github.com/jhlywa/chess.js)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)

---

**Happy Coding! 🚀**

