# Tamil Sign Bridge

> Transform your gestures into voice. Breaking barriers, building connections.

## Overview

Tamil Sign Bridge is a real-time web application that recognizes Tamil sign language gestures from a webcam and speaks the corresponding Tamil sentence or phrase aloud. Built entirely in the browser using cutting-edge AI technology, this application provides an accessible communication tool for the Tamil sign language community.

## Features

✨ **Real-time Recognition** - Instant sign detection powered by TensorFlow.js  
🎙️ **Text-to-Speech** - Automatic voice output for recognized signs  
🎯 **High Accuracy** - Adjustable AI confidence threshold  
📝 **Conversation Log** - Track and replay your sign history  
⚙️ **Customizable Settings** - Adjust speech speed, confidence levels, and voice selection  
🌓 **Dark/Light Mode** - Beautiful UI that adapts to your preference  
📊 **Performance Metrics** - Real-time FPS and prediction timing  
📚 **Sign Library** - Built-in reference guide for all supported signs  

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **AI/ML**: TensorFlow.js
- **Speech**: Web Speech API
- **Build Tool**: Vite
- **Routing**: React Router

## Project Structure

```
src/
├── pages/
│   ├── Welcome.tsx              # Landing page with name input
│   └── SignLanguageApp.tsx      # Main application
├── components/
│   ├── app/
│   │   ├── ModelUploader.tsx    # Drag-and-drop model upload
│   │   ├── VideoDisplay.tsx     # Webcam feed with canvas overlay
│   │   ├── ConversationLog.tsx  # Message history with replay
│   │   ├── TextInput.tsx        # Manual text-to-speech input
│   │   ├── SettingsPanel.tsx    # Configuration controls
│   │   ├── PerformanceMetrics.tsx # FPS and timing display
│   │   └── PredictionDisplay.tsx  # Current sign detection
│   └── modals/
│       └── SignLibraryModal.tsx # Sign reference guide
├── lib/
│   ├── modelHandler.ts          # TensorFlow.js model management
│   ├── speechHandler.ts         # Speech synthesis logic
│   └── types.ts                 # TypeScript interfaces
├── hooks/
│   └── useTheme.ts              # Dark/light mode management
└── index.css                    # Design system & animations
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser with webcam support
- Teachable Machine model (.zip file)

### Installation

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Note**: After cloning, the project folder name will match your Git repository name.

### Creating Your Model

1. Visit [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Create an "Image Project"
3. Add classes for each Tamil sign phrase you want to recognize
4. Train your model with sample images/webcam
5. Export as "TensorFlow.js" and download the .zip file
6. Upload the .zip file in the application

## Usage

1. **Welcome Screen**: Enter your name and click "Get Started"
2. **Upload Model**: Drag and drop your Teachable Machine model (.zip)
3. **Start Application**: Click "Start" to activate the camera
4. **Perform Signs**: Make signs in front of your webcam
5. **Auto-Speech**: The app will automatically speak recognized signs
6. **Manual Input**: Type text and click "Speak" for manual voice output
7. **Adjust Settings**: Fine-tune confidence threshold, speech rate, and voice

## Supported Tamil Signs

The application supports any Tamil sign phrases you train your model with. Common examples include:

- தயவுசெய்து எனக்கு உடனே உதவி செய்யவும் (Please help me immediately)
- நான் ஆபத்தில் இருக்கிறேன் (I am in danger)
- யாரோ என்னை பின்தொடர்கிறார்கள் (Someone is following me)
- எனக்கு மயக்கம் வருகிறது (I am feeling dizzy)
- தீ வேகமாக பரவி வருகிறது (Fire is spreading fast)

## Configuration

### AI Settings

- **Confidence Threshold**: 50-95% (default: 70%)
  - Higher values = more accurate but fewer detections
  - Lower values = more detections but possible false positives

- **Speech Rate**: 0.5x - 2.0x (default: 1.0x)
  - Adjust how fast the voice speaks

- **Voice Selection**: Choose from available system voices
  - Tamil voices automatically prioritized when available

### Performance

- **Prediction Interval**: 200ms (~5 FPS)
- **Stability Requirement**: 5 consecutive matching predictions
- **Auto-Speech Cooldown**: 10 seconds per sign

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full Support |
| Edge 90+ | ✅ Full Support |
| Firefox 88+ | ✅ Full Support |
| Safari 14+ | ⚠️ Limited (No Tamil voices) |

## Future Enhancements

- 🔄 **Progressive Web App (PWA)**: Install on mobile devices and work offline
- 🌍 **Multi-language Support**: Expand beyond Tamil
- 📱 **Mobile Optimization**: Enhanced mobile gesture recognition
- 🎨 **Custom Sign Creator**: Built-in tool to create and train models
- 💾 **Cloud Sync**: Save models and settings across devices
- 🤝 **Collaborative Learning**: Share and download community models

## Accessibility

This application is designed with accessibility in mind:

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast color schemes
- Adjustable font sizes
- Clear visual feedback

## Troubleshooting

### Camera Not Working

1. Check browser permissions (allow camera access)
2. Ensure no other applications are using the camera
3. Try refreshing the page
4. Use Chrome/Edge for best compatibility

### Model Loading Failed

1. Verify your .zip file contains: `model.json`, `weights.bin`, `metadata.json`
2. Ensure the model was exported from Teachable Machine
3. Check file size (should be under 50MB)
4. Try re-exporting from Teachable Machine

### No Tamil Voices Available

1. Install Tamil language pack on your operating system
2. Use Chrome/Edge for better voice support
3. Manual voice selection available in Settings

## Deployment

Simply open [Lovable](https://lovable.dev) and click Share → Publish.

## Custom Domain

To connect a custom domain, navigate to Project > Settings > Domains in Lovable and click Connect Domain. Note: A paid Lovable plan is required.

## Contributing

This project was built with ❤️ for the Tamil community. Contributions are welcome!

## License

This project is built with Lovable and follows their standard terms.

## Acknowledgments

- TensorFlow.js team for making ML accessible in browsers
- Teachable Machine for democratizing AI model training
- shadcn/ui for beautiful, accessible components
- The Tamil sign language community

## Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the development team.

---

**Built with [Lovable](https://lovable.dev)** - Create beautiful, AI-powered web applications
