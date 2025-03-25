
# FutureMe - Time Capsule Messages

![alt text](image.png)

**FutureMe** is a digital time capsule application that allows users to write messages to their future selves, set a reveal date, and revisit them when the time comes. With a sleek, professional design, this project features a responsive interface, a navigation bar, and additional sections like Home, Stats, and About, making it both functional and user-friendly across all devices.

---

## Table of Contents
1. [Features](#features)
2. [Installation](#installation)

---

## Features

- **Message Creation-** Write messages with a maximum of 500 characters, set a future reveal date, and assign categories (e.g., Goals, Memories).
- **Message Management-** View, edit, and delete messages categorized as "Future" (unrevealed) or "Past" (revealed).
- **Search and Sort-** Search messages by text or category, and sort by date or alphabetically.
- **Theme Toggle-** Switch between light and dark modes, with preferences saved in localStorage.
- **Notifications-** Receive success or error alerts for actions like sending, editing, or deleting messages.
- **Stats Dashboard-** View total, future, and past message counts in a dedicated section.
- **Responsive Design-** Fully optimized for all screen sizes, from mobile phones to desktops, with a collapsible navbar for smaller screens.
- **Navigation-** A sticky navbar with links to Home, Messages, Stats, and About sections.
- **Local Backup-** Messages are cached in localStorage for offline access in case of server issues.

---

## Installation

### Steps
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/AmedDavid/future-me.git
   cd future-me
   ```

2. **Install Dependencies:**
   Install the JSON server globally if not already installed:
   ```bash
   npm install -g json-server
   ```

3. **Set Up the Database:**
   Create a `db.json` file in the project root with the following structure:
   ```json
   {
     "messages": []
   }
   ```

4. **Run the Server:**
   Start the JSON server to simulate a backend API:
   ```bash
   json-server --watch db.json --port 3000
   ```

5. **Serve the Project:**
   Use a local server to run the frontend (`live-server`):

   Alternatively, open `index.html` in a browser, but some features (e.g., fetch requests) may require a server due to CORS.

6. **Access the App:**
   Open your browser and navigate to `http://127.0.0.1:5500/index.html` (or the port provided by `live-server`).

---