# FocusList - Task Tracker

A modern, professional task tracking application with a beautiful dashboard and comprehensive task management features.

## Features

### 📊 Dashboard
- **Overview Statistics**: View completed tasks, total tasks, overall progress, and active categories
- **Category Cards**: Visual representation of tasks grouped by category (Work, Learning, Health, Personal)
- **Progress Tracking**: Real-time progress bars and completion percentages
- **Professional UI**: Modern design with FontAwesome icons, gradients, and smooth animations

### ✅ Task Management
- **Add Tasks**: Create tasks with name, start date, end deadline, and category
- **Task Categories**: Organize tasks into Work, Learning, Health, and Personal categories
- **Task Grouping**: Automatically groups tasks by status (Overdue, Due Today, This Week, Later)
- **Toggle Completion**: Mark tasks as complete/incomplete with a single click
- **Delete Tasks**: Remove tasks you no longer need

### 🎨 Design Highlights
- Clean, modern interface with Inter font
- Professional color palette with category-specific gradients
- Responsive design that works on all screen sizes
- Custom-styled checkboxes and form inputs
- Smooth transitions and hover effects

## Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties and gradients
- **JavaScript (ES6+)** - Interactive functionality
- **FontAwesome 6.4.0** - Professional icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (optional, falls back to in-memory storage)
- **Mongoose** - MongoDB ODM
- **Nodemon** - Development auto-reload

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pawanmahajan029/FocusList.git
   cd FocusList
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   Create a `.env` file in the root directory:
   ```
   PORT=7845
   MONGODB_URI=mongodb://localhost:27017/tasktracker
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   - Main Task List: `frontend/index.html`
   - Dashboard: `frontend/dashboard.html`

## Usage

### Adding a Task
1. Enter the task name
2. Set the start date (optional) and end deadline
3. Select a category (Work, Learning, Health, Personal)
4. Click "Add Task"

### Viewing Dashboard
- Navigate to `dashboard.html` to see your task overview
- View statistics by category
- Track overall progress

### Managing Tasks
- **Check/Uncheck**: Click the checkbox to toggle completion
- **Delete**: Click the trash icon to remove a task
- **Filter**: Use category filters to view specific task groups

## Project Structure

```
task-tracker/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── models/
│   │   └── Task.js            # Task model schema
│   ├── routes/
│   │   └── tasks.js           # API routes
│   ├── utils/
│   │   ├── backlogManager.js  # Backlog management utilities
│   │   ├── deadlineCalculator.js # Progress calculations
│   │   └── scheduler.js       # Scheduling utilities
│   └── server.js              # Express server setup
├── frontend/
│   ├── index.html             # Main task list page
│   ├── dashboard.html         # Dashboard overview page
│   ├── app.js                 # Task list functionality
│   ├── dashboard.js           # Dashboard functionality
│   ├── styles.css             # Main task list styles
│   └── dashboard.css          # Dashboard styles
├── package.json
└── README.md
```

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id/progress` - Update task progress
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/health` - Health check endpoint

## Features in Detail

### Offline Support
The application works even without MongoDB installed. It automatically falls back to in-memory storage when the database is unavailable.

### Fast Performance
- 1-second timeout on API calls for quick fallback
- Preconnect hints for external resources
- Optimized rendering and calculations

### Accurate Progress Tracking
Progress is calculated based on completed items vs. total items, not just fully completed tasks. This means partial progress is accurately reflected.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Author

Pawan Mahajan

## Acknowledgments

Built with modern web technologies and best practices for a seamless user experience.
