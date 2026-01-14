# Docker Modern

A modern, intuitive web interface for managing Docker right inside Cockpit. View your containers, images, networks, and volumes with real-time stats and monitoring.

![Status](https://img.shields.io/badge/status-stable-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Cockpit](https://img.shields.io/badge/cockpit-200%2B-informational)
<img width="1354" height="807" alt="docker-modernm" src="https://github.com/user-attachments/assets/ee167869-dc8f-4d04-bcc1-3fb5117c0978" />

## Features

- **Dashboard** — Real-time overview of all Docker resources with system metrics
- **Container Management** — Start, stop, and remove containers with detailed logs
- **Image Management** — Browse, run, and delete Docker images
- **Networks & Volumes** — View and manage Docker networks and persistent volumes
- **System Monitoring** — Live CPU and memory usage tracking
- **Fast Search** — Quickly find containers and images by name
- **Dark Mode** — Multiple color themes including dark mode by default
- **Auto Refresh** — Configurable automatic updates (5-60 seconds)
- **Responsive Design** — Works great on desktop and tablet browsers

## Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/docker-modern.git

# Copy to Cockpit plugins directory
sudo cp -r docker-modern /usr/share/cockpit/docker-modern

# Restart Cockpit (usually automatic, but you can force it)
sudo systemctl restart cockpit.service
```

### Requirements

- Cockpit 200 or newer (standard on most modern Linux distros)
- Docker installed and running
- Your user should be in the docker group, or you need sudo access

### Verify Installation

1. Open Cockpit in your browser (usually `https://localhost:9090`)
2. Look for **Docker** in the left sidebar
3. You should see the dashboard with all your Docker stats

## How to Use

### Dashboard
Gets you a quick snapshot of your Docker environment:
- How many containers you have (total and running)
- Number of images and their total size
- How much disk space Docker is using
- Current system resource usage
- Recent Docker activity
- Available networks

### Containers
Manage individual containers:
- See all containers (running and stopped)
- Start or stop any container with one click
- View the last 100 lines of logs
- Delete containers
- See useful info like ports, image used, and when it was created

### Images
Browse and work with Docker images:
- View all available images
- See image size and creation date
- Run a new container from any image
- Delete images you don't need

### Networks & Volumes
Check your Docker networking and storage:
- List all Docker networks and their drivers
- See connected containers
- View persistent volumes and their mount points

### Settings
Customize your experience:
- **Theme** — Choose between Dark Mode (default), Blue, Purple, or Green
- **Auto Refresh** — Turn auto-refresh on/off
- **Refresh Speed** — Set how often the dashboard updates (5-60 seconds)

Your settings are saved to your browser, so they'll be there next time you visit.

## Architecture

### Built With
- **Vanilla JavaScript** — No frameworks, just clean JS
- **Cockpit Framework** — Leverages Cockpit's Docker API
- **CSS Grid & Flexbox** — Responsive, modern styling
- **System Icons** — Uses native system icons for clean design

### File Structure
```
docker-modern/
├── index.html      # Main page structure
├── docker.js       # All the logic (1300+ lines)
├── docker.css      # Styling and themes
├── manifest.json   # Cockpit configuration
└── README.md       # This file
```

### How It Works
The plugin talks to Docker through Cockpit's secure API. When you click something (like "Start Container"), it runs the actual Docker command on your system and shows you the results. It auto-refreshes your data so you see what's happening in real-time.

## Docker Commands Used

Here's what happens behind the scenes:

| Action | Docker Command |
|--------|---|
| List containers | `docker ps -a` |
| List images | `docker images` |
| List networks | `docker network ls` |
| Start container | `docker start [id]` |
| Stop container | `docker stop [id]` |
| Delete container | `docker rm [id]` |
| View logs | `docker logs [id]` |
| Check usage | `docker system df` |
| Remove image | `docker rmi [id]` |

All commands include proper error handling and confirmation dialogs for destructive operations.

## Security

- **Authentication Required** — Everything goes through Cockpit's login
- **Safe Logging** — Logs are displayed as text, never raw HTML (no XSS attacks)
- **Input Validation** — Container names are checked before running commands
- **Confirmations** — Destructive operations (delete, remove) ask for confirmation
- **User Permissions** — You can only do what your user account can do with Docker

## Troubleshooting

### Plugin not showing up in Cockpit?
```bash
# Check it's in the right place
ls -la /usr/share/cockpit/docker-modern/

# Fix permissions if needed
sudo chmod -R 755 /usr/share/cockpit/docker-modern/

# Restart Cockpit
sudo systemctl restart cockpit.service
```

### Getting "Permission Denied"?
```bash
# Check if you're in the docker group
groups $USER

# Add yourself to the docker group if needed
sudo usermod -aG docker $USER

# Log out and back in for the change to take effect
```

### Commands not working?
1. Make sure Docker is running: `docker ps`
2. Check your Cockpit user has Docker access
3. Open browser console (F12) to see if there are error messages
4. Try the manual refresh button

## Development

### Making Changes

The plugin is all vanilla JavaScript — no build process needed. Just edit the files and refresh your browser:

```bash
# Edit any file
nano /usr/share/cockpit/docker-modern/docker.js

# Refresh browser to see changes
# No restart needed!
```

### Code Overview

**docker.js** does everything:
- Fetching Docker info and displaying it
- Handling button clicks and user actions
- Managing themes and settings
- Showing errors and success messages

**docker.css** handles:
- Layout and colors
- All four theme options
- Mobile-responsive design
- Smooth animations

**index.html** is the:
- Navigation bar
- Settings modal
- Main content area
- Connection to Cockpit

## Contributing

Found a bug or have an idea? We'd love your help!

1. Fork the repository
2. Make your changes
3. Test it in your Cockpit
4. Submit a pull request

Just follow the existing code style and test on a modern browser.

## What's Not Supported (Yet)

- Building Docker images
- Running commands inside containers
- Docker Compose integration
- Bulk operations on multiple resources

These might come in future versions.

## License

MIT License — use it freely, modify it, share it. See the LICENSE file for details.

## Questions?

- **Bug Reports** — Use GitHub Issues
- **Questions** — Check existing issues or create a new one
- **Cockpit Help** — https://cockpit-project.org/
- **Docker Help** — https://docs.docker.com/

---

Made for people who want a simpler way to manage Docker.
