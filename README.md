# Your_Reliever

A comprehensive mental health and wellness platform designed to help users find peace, manage stress, and connect with professional support.

## Features

### Core Features
- **Stress & Anxiety Management** - Guided breathing exercises, meditation techniques, and stress relief tools
- **Professional Support** - Connect with licensed mental health professionals for booking sessions
- **Content Library** - Access curated mental health resources, articles, and self-help materials
- **Chat Forum** - Community-driven support groups and discussion forums
- **Emergency Support** - Quick access to crisis resources and emergency contacts
- **User Profiles** - Personalized dashboards to track progress and manage appointments

### Technical Features
- **Real-time Chat** - WebSocket-based messaging system
- **Secure Authentication** - User registration and login system
- **Responsive Design** - Mobile-friendly interface that works on all devices
- **API Backend** - RESTful API with PHP/MySQL backend
- **File Upload** - Support for document and media uploads

##  Tech Stack

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with animations and transitions
- **JavaScript (ES6+)** - Interactive features and client-side logic
- **Font Awesome** - Icon library for UI elements

### Backend
- **PHP** - Server-side logic and API endpoints
- **MySQL** - Database for user data, content, and messaging
- **WebSocket** - Real-time communication for chat features

### Key Files Structure
```
YourReliever/
├── frontend/
│   ├── Index.html              # Main landing page
│   ├── LogIn.html              # User authentication
│   ├── register.html           # User registration
│   ├── Stress&Anxiety.html     # Stress management tools
│   ├── BookProfessional.html   # Professional booking
│   ├── ContentLibrary.html     # Resource library
│   ├── ChatForum.html          # Community forums
│   ├── Emergency.html          # Crisis support
│   ├── profile.html            # User dashboard
│   ├── styles.css              # Main stylesheet
│   └── Script.js               # Core JavaScript functionality
├── backend/
│   ├── api/                    # REST API endpoints
│   │   ├── auth.php           # Authentication
│   │   ├── bookings.php       # Booking management
│   │   ├── content.php        # Content management
│   │   ├── forum.php          # Forum operations
│   │   ├── messages.php       # Messaging system
│   │   └── user.php           # User management
│   ├── Database/              # Database schema and migrations
│   ├── models/                # Data models
│   ├── ws/                    # WebSocket server
│   └── config.php             # Configuration settings
└── Project Documentation/      # Design documents and specifications
```

## Getting Started

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx)
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arafatNsubuga/Your_Reliever.git
   cd Your_Reliever
   ```

2. **Database Setup**
   - Create a MySQL database named `yourreliever`
   - Import the database schema from `backend/Database/`
   - Update database credentials in `backend/config.php`

3. **Configure the Application**
   ```php
   // backend/config.php
   return [
     'db' => [
       'host' => '127.0.0.1',
       'port' => 3306,
       'name' => 'yourreliever',
       'user' => 'your_db_user',
       'pass' => 'your_db_password',
       'charset' => 'utf8mb4'
     ],
     'app' => [
       'session_name' => 'YRSESSID',
       'base_url' => 'http://localhost/Your_Reliever'
     ]
   ];
   ```

4. **Web Server Configuration**
   - Point your web server root to the project directory
   - Ensure PHP is configured to handle `.php` files
   - Set up URL rewriting for clean URLs (optional)

5. **Start WebSocket Server** (for real-time chat)
   ```bash
   cd backend/ws
   php server.php
   ```

6. **Access the Application**
   - Open your browser and navigate to `http://localhost/Your_Reliever`
   - Register a new account or login with existing credentials

##  Usage

### For Users
1. **Create an Account** - Register with your email and create a secure password
2. **Explore Resources** - Browse the content library for mental health resources
3. **Join Discussions** - Participate in community forums and support groups
4. **Book Professionals** - Schedule appointments with licensed therapists
5. **Track Progress** - Use your profile dashboard to monitor your wellness journey

### For Professionals
1. **Register as Professional** - Create a professional profile with credentials
2. **Set Availability** - Manage your calendar and available time slots
3. **Conduct Sessions** - Connect with clients through the platform
4. **Share Resources** - Contribute to the content library with expert insights

## API Endpoints

### Authentication
- `POST /api/auth.php` - User login/logout
- `POST /api/user.php` - User registration and profile management

### Content & Resources
- `GET /api/content.php` - Retrieve content library items
- `POST /api/upload.php` - Upload new content

### Booking System
- `GET /api/bookings.php` - View available professionals
- `POST /api/bookings.php` - Create and manage appointments

### Messaging & Forum
- `GET /api/forum.php` - Access forum discussions
- `POST /api/messages.php` - Send and receive messages


### Development Guidelines
- Follow PSR-12 coding standards for PHP
- Use semantic HTML5 and accessible CSS
- Write clean, commented JavaScript
- Test all functionality before submitting PRs

##  Acknowledgments

- Mental health professionals who contributed expertise
- Open source community for valuable tools and libraries
- Users who help test and improve the platform

##  Support & Contact

- **Project Maintainer**: Arafat Nsubuga, nsubugaarafat027@gmail.com
- **GitHub Issues**: [Report bugs and request features](https://github.com/arafatNsubuga/Your_Reliever/issues)
- **Emergency Resources**: Available in-app for immediate crisis support

##  Privacy & Security

Your mental health data is sensitive and important to us. This platform implements:
- Secure user authentication with session management
- Encrypted data transmission (HTTPS recommended)
- Privacy-focused design principles
- Compliance with mental health data protection standards

---

**Disclaimer**: This platform is designed to support mental wellness and is not a substitute for professional medical care. In case of emergency, please contact local emergency services or crisis hotlines immediately.
