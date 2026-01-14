class DockerManager {
    constructor() {
        this.currentView = 'dashboard';
        this.containers = [];
        this.images = [];
        this.networks = [];
        this.volumes = [];
        this.stats = {};
        this.systemStats = {};
        this.intervalId = null;
        this.autoRefresh = true;
        this.refreshInterval = 10000; // 10 seconds
        this.searchTerm = '';
        this.currentTheme = localStorage.getItem('docker-theme') || 'dark';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme(this.currentTheme);
        this.loadView('dashboard');
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Navigation - updated for new nav structure
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.closest('.nav-item').dataset.view;
                this.loadView(view);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCurrentView());
        }

        // Settings button and modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = document.getElementById('close-settings');
        
        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.classList.add('active');
            });
        }
        
        if (closeSettings && settingsModal) {
            closeSettings.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });
        }
        
        // Click outside modal to close
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove('active');
                }
            });
        }

        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.target.closest('.theme-option').dataset.theme;
                this.changeTheme(theme);
            });
        });

        // Auto refresh settings
        const autoRefreshCheckbox = document.getElementById('auto-refresh');
        const refreshIntervalSlider = document.getElementById('refresh-interval');
        const intervalDisplay = document.getElementById('interval-display');

        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.addEventListener('change', (e) => {
                this.autoRefresh = e.target.checked;
                if (this.autoRefresh) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            });
        }

        if (refreshIntervalSlider && intervalDisplay) {
            refreshIntervalSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                this.refreshInterval = value * 1000;
                intervalDisplay.textContent = value + 's';
                if (this.autoRefresh) {
                    this.startAutoRefresh(); // Restart with new interval
                }
            });
        }

        // Search functionality - improved
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterCurrentView();
            });
        }
    }

    changeTheme(theme) {
        // Update active theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
        
        // Apply theme
        this.applyTheme(theme);
        this.currentTheme = theme;
        localStorage.setItem('docker-theme', theme);
    }

    applyTheme(theme) {
        const navbar = document.querySelector('.top-navbar');
        if (!navbar) return;

        switch (theme) {
            case 'purple':
                navbar.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                break;
            case 'green':
                navbar.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                break;
            case 'dark':
                navbar.style.background = 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
                break;
            default:
                navbar.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
                break;
        }
    }

    loadView(view) {
        this.currentView = view;
        
        // Update navigation - updated for new nav structure
        document.querySelectorAll('.nav-item').forEach(link => {
            link.classList.remove('active');
        });
        const activeNav = document.querySelector(`[data-view="${view}"]`);
        if (activeNav) activeNav.classList.add('active');

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'containers': 'Containers',
            'images': 'Images',
            'networks': 'Networks',
            'volumes': 'Volumes'
        };
        
        const titleElement = document.getElementById('main-title');
        if (titleElement) {
            titleElement.textContent = titles[view] || 'Dashboard';
        }

        // Load content
        this.renderView(view);
    }

    async renderView(view) {
        const content = document.getElementById('main-content');
        
        switch (view) {
            case 'dashboard':
                await this.renderDashboard();
                break;
            case 'containers':
                await this.renderContainers();
                break;
            case 'images':
                await this.renderImages();
                break;
            case 'networks':
                await this.renderNetworks();
                break;
            case 'volumes':
                await this.renderVolumes();
                break;
        }
    }

    async renderDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="dashboard-overview">
                <div class="stats-grid">
                    <div class="stat-card primary">
                        <div class="stat-icon">
                            <i class="fas fa-cube"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="total-containers">0</h3>
                            <p>Total Containers</p>
                            <small class="stat-change" id="containers-change">+0 this week</small>
                        </div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-icon">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="running-containers">0</h3>
                            <p>Running</p>
                            <small class="stat-change" id="running-percentage">0% uptime</small>
                        </div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-icon">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="total-images">0</h3>
                            <p>Images</p>
                            <small class="stat-change" id="images-size">0 MB total</small>
                        </div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-icon">
                            <i class="fas fa-hdd"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="disk-usage">0 MB</h3>
                            <p>Disk Usage</p>
                            <small class="stat-change" id="disk-reclaimable">0 MB reclaimable</small>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-grid">
                    <div class="card system-metrics">
                        <div class="card-header">
                            <h4><i class="fas fa-server"></i> System Resources</h4>
                            <span class="status-indicator online" id="system-status">Online</span>
                        </div>
                        <div class="card-body">
                            <div class="metric-row">
                                <div class="metric-info">
                                    <label>CPU Usage</label>
                                    <span class="metric-value" id="cpu-usage">0%</span>
                                </div>
                                <div class="metric-bar">
                                    <div class="progress-bar">
                                        <div class="progress-fill" id="cpu-progress" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="metric-row">
                                <div class="metric-info">
                                    <label>Memory Usage</label>
                                    <span class="metric-value" id="memory-usage">0 MB / 0 MB</span>
                                </div>
                                <div class="metric-bar">
                                    <div class="progress-bar">
                                        <div class="progress-fill memory" id="memory-progress" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="metric-row">
                                <div class="metric-info">
                                    <label>Container CPU</label>
                                    <span class="metric-value" id="container-cpu">0%</span>
                                </div>
                                <div class="metric-bar">
                                    <div class="progress-bar">
                                        <div class="progress-fill container" id="container-cpu-progress" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card system-info">
                        <div class="card-header">
                            <h4><i class="fas fa-info-circle"></i> System Information</h4>
                            <button class="refresh-btn" id="refresh-system-info" title="Refresh System Info">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        <div class="card-body" id="system-info">
                            <div class="loading">Loading system information...</div>
                        </div>
                    </div>
                    
                    <div class="card activity-feed">
                        <div class="card-header">
                            <h4><i class="fas fa-history"></i> Recent Activity</h4>
                            <button class="refresh-btn" id="refresh-activity" title="Refresh Activity">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        <div class="card-body" id="recent-activity">
                            <div class="loading">Loading recent activity...</div>
                        </div>
                    </div>
                    
                    <div class="card docker-info">
                        <div class="card-header">
                            <h4><i class="fab fa-docker"></i> Docker Engine</h4>
                        </div>
                        <div class="card-body" id="docker-engine-info">
                            <div class="loading">Loading Docker information...</div>
                        </div>
                    </div>
                    
                    
                    <div class="card network-overview">
                        <div class="card-header">
                            <h4><i class="fas fa-network-wired"></i> Network Overview</h4>
                        </div>
                        <div class="card-body" id="network-overview">
                            <div class="loading">Loading network information...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Update dashboard data
        await this.updateDashboardStats();
        await this.updateSystemMetrics();
        await this.updateRecentActivity();
    }

    async updateDashboardStats() {
        try {
            // Get containers list
            const containersResult = await cockpit.spawn(['docker', 'ps', '-a', '--format', '{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}']);
            this.containers = this.parseContainers(containersResult);
            
            // Get images list
            const imagesResult = await cockpit.spawn(['docker', 'images', '--format', '{{.Repository}}:{{.Tag}}|{{.ID}}|{{.Size}}']);
            this.images = this.parseImages(imagesResult);

            // Update stat displays
            const totalContainers = this.containers.length;
            const runningContainers = this.containers.filter(c => c.status.includes('Up')).length;
            const totalImages = this.images.length;

            document.getElementById('total-containers').textContent = totalContainers;
            document.getElementById('running-containers').textContent = runningContainers;
            document.getElementById('total-images').textContent = totalImages;

            // Update additional stats
            const uptimePercentage = totalContainers > 0 ? Math.round((runningContainers / totalContainers) * 100) : 0;
            document.getElementById('running-percentage').textContent = `${uptimePercentage}% active`;

            // Calculate disk usage
            let totalSize = 0;
            let totalImageSize = 0;
            this.images.forEach(img => {
                const sizeStr = img.size || '0MB';
                const sizeMatch = sizeStr.match(/(\d+(?:\.\d+)?)(GB|MB|KB)/);
                if (sizeMatch) {
                    const value = parseFloat(sizeMatch[1]);
                    const unit = sizeMatch[2];
                    let sizeInMB = 0;
                    if (unit === 'GB') sizeInMB = value * 1024;
                    else if (unit === 'MB') sizeInMB = value;
                    else if (unit === 'KB') sizeInMB = value / 1024;
                    
                    totalSize += sizeInMB;
                    totalImageSize += sizeInMB;
                }
            });
            
            document.getElementById('disk-usage').textContent = totalSize > 1024 ? 
                (totalSize / 1024).toFixed(1) + ' GB' : 
                totalSize.toFixed(0) + ' MB';
            
            document.getElementById('images-size').textContent = totalImageSize > 1024 ? 
                (totalImageSize / 1024).toFixed(1) + ' GB total' : 
                totalImageSize.toFixed(0) + ' MB total';

            // Get Docker system df for reclaimable space
            try {
                const dockerDf = await cockpit.spawn(['docker', 'system', 'df', '--format', 'table']);
                const lines = dockerDf.trim().split('\n');
                let reclaimableSpace = 0;
                
                lines.forEach(line => {
                    const match = line.match(/(\d+(?:\.\d+)?)(GB|MB|KB)\s+\((\d+)%\)/);
                    if (match) {
                        const value = parseFloat(match[1]);
                        const unit = match[2];
                        let sizeInMB = 0;
                        if (unit === 'GB') sizeInMB = value * 1024;
                        else if (unit === 'MB') sizeInMB = value;
                        else if (unit === 'KB') sizeInMB = value / 1024;
                        reclaimableSpace += sizeInMB;
                    }
                });
                
                document.getElementById('disk-reclaimable').textContent = reclaimableSpace > 1024 ? 
                    (reclaimableSpace / 1024).toFixed(1) + ' GB reclaimable' : 
                    reclaimableSpace.toFixed(0) + ' MB reclaimable';
            } catch (error) {
                document.getElementById('disk-reclaimable').textContent = 'Unknown reclaimable';
            }

            // Update system info
            this.updateSystemInfo();
            
        } catch (error) {
            console.error('Failed to update dashboard stats:', error);
            this.showError('Failed to load dashboard statistics');
        }
    }

    async updateSystemMetrics() {
        try {
            // Get system CPU and memory info
            const memInfo = await cockpit.spawn(['cat', '/proc/meminfo']);
            const loadavg = await cockpit.spawn(['cat', '/proc/loadavg']);
            
            // Parse memory info
            const memLines = memInfo.split('\n');
            let memTotal = 0, memAvailable = 0;
            
            memLines.forEach(line => {
                if (line.startsWith('MemTotal:')) {
                    memTotal = parseInt(line.split(/\s+/)[1]) / 1024; // Convert to MB
                } else if (line.startsWith('MemAvailable:')) {
                    memAvailable = parseInt(line.split(/\s+/)[1]) / 1024; // Convert to MB
                }
            });
            
            const memUsed = memTotal - memAvailable;
            const memPercentage = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
            
            // Parse load average for CPU
            const loadParts = loadavg.trim().split(/\s+/);
            const load1min = parseFloat(loadParts[0]);
            
            // Get number of CPU cores
            const cpuInfo = await cockpit.spawn(['nproc']);
            const cpuCores = parseInt(cpuInfo.trim());
            const cpuPercentage = Math.min((load1min / cpuCores) * 100, 100);
            
            // Update display
            document.getElementById('cpu-usage').textContent = `${cpuPercentage.toFixed(1)}%`;
            document.getElementById('cpu-progress').style.width = `${cpuPercentage}%`;
            
            document.getElementById('memory-usage').textContent = 
                `${memUsed.toFixed(0)} MB / ${memTotal.toFixed(0)} MB`;
            document.getElementById('memory-progress').style.width = `${memPercentage}%`;
            
            // Get container resource usage
            try {
                const containerStats = await cockpit.spawn(['docker', 'stats', '--no-stream', '--format', 
                    '{{.Container}}|{{.CPUPerc}}|{{.MemUsage}}']);
                
                let totalContainerCpu = 0;
                const statLines = containerStats.trim().split('\n').filter(line => line.length > 0);
                
                statLines.forEach(line => {
                    const parts = line.split('|');
                    if (parts.length >= 2) {
                        const cpuStr = parts[1].replace('%', '');
                        const cpu = parseFloat(cpuStr) || 0;
                        totalContainerCpu += cpu;
                    }
                });
                
                document.getElementById('container-cpu').textContent = `${totalContainerCpu.toFixed(1)}%`;
                document.getElementById('container-cpu-progress').style.width = `${Math.min(totalContainerCpu, 100)}%`;
                
            } catch (error) {
                console.error('Failed to get container stats:', error);
                document.getElementById('container-cpu').textContent = 'N/A';
                document.getElementById('container-cpu-progress').style.width = '0%';
            }
            
        } catch (error) {
            console.error('Failed to update system metrics:', error);
            // Set fallback values
            document.getElementById('cpu-usage').textContent = 'N/A';
            document.getElementById('memory-usage').textContent = 'N/A';
            document.getElementById('container-cpu').textContent = 'N/A';
        }
    }

    async updateRecentActivity() {
        try {
            // Get recent container events
            const dockerEvents = await cockpit.spawn(['docker', 'events', '--since', '24h', '--format', 
                '{{.Time}}|{{.Action}}|{{.Actor.Attributes.name}}|{{.Type}}'], { timeout: 3000 });
            
            const activityContainer = document.getElementById('recent-activity');
            const events = dockerEvents.trim().split('\n').filter(line => line.length > 0);
            
            if (events.length === 0) {
                activityContainer.innerHTML = '<div class="no-activity">No recent activity</div>';
                return;
            }
            
            // Take last 10 events and format them
            const recentEvents = events.slice(-10).reverse();
            let activityHtml = '<div class="activity-list">';
            
            recentEvents.forEach(event => {
                const [timestamp, action, name, type] = event.split('|');
                const time = new Date(parseInt(timestamp) * 1000);
                const timeStr = time.toLocaleTimeString();
                
                let icon = 'fa-circle';
                let className = 'activity-item';
                
                switch(action) {
                    case 'start':
                        icon = 'fa-play';
                        className += ' success';
                        break;
                    case 'stop':
                        icon = 'fa-stop';
                        className += ' warning';
                        break;
                    case 'create':
                        icon = 'fa-plus';
                        className += ' info';
                        break;
                    case 'destroy':
                    case 'remove':
                        icon = 'fa-trash';
                        className += ' danger';
                        break;
                    case 'pull':
                        icon = 'fa-download';
                        className += ' info';
                        break;
                    default:
                        icon = 'fa-circle';
                }
                
                activityHtml += `
                    <div class="${className}">
                        <div class="activity-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">
                                <strong>${action}</strong> ${type}: ${name || 'unknown'}
                            </div>
                            <div class="activity-time">${timeStr}</div>
                        </div>
                    </div>
                `;
            });
            
            activityHtml += '</div>';
            activityContainer.innerHTML = activityHtml;
            
        } catch (error) {
            console.error('Failed to get recent activity:', error);
            const activityContainer = document.getElementById('recent-activity');
            activityContainer.innerHTML = `
                <div class="activity-fallback">
                    <div class="activity-item info">
                        <div class="activity-icon">
                            <i class="fas fa-info-circle"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">System monitoring active</div>
                            <div class="activity-time">Now</div>
                        </div>
                    </div>
                    <div class="activity-item success">
                        <div class="activity-icon">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">Dashboard loaded successfully</div>
                            <div class="activity-time">${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async updateSystemInfo() {
        try {
            const systemInfo = document.getElementById('system-info');
            
            // Get system information
            const dockerVersion = await cockpit.spawn(['docker', 'version', '--format', '{{.Server.Version}}']);
            const hostname = await cockpit.spawn(['hostname']);
            const uptime = await cockpit.spawn(['uptime', '-p']);
            const kernelVersion = await cockpit.spawn(['uname', '-r']);
            
            // Get Docker engine info
            const dockerInfo = await cockpit.spawn(['docker', 'info', '--format', 
                '{{.ServerVersion}}|{{.Architecture}}|{{.OSType}}|{{.KernelVersion}}|{{.Containers}}|{{.ContainersRunning}}|{{.ContainersStopped}}']);
            
            const [serverVersion, arch, osType, kernel, containers, running, stopped] = dockerInfo.trim().split('|');
            
            systemInfo.innerHTML = `
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Host</div>
                        <div class="info-value">${hostname.trim()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Uptime</div>
                        <div class="info-value">${uptime.trim().replace('up ', '')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Kernel</div>
                        <div class="info-value">${kernelVersion.trim()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Architecture</div>
                        <div class="info-value">${arch}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Docker Version</div>
                        <div class="info-value">${dockerVersion.trim()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">OS Type</div>
                        <div class="info-value">${osType}</div>
                    </div>
                </div>
            `;

            // Update Docker engine info
            const dockerEngineInfo = document.getElementById('docker-engine-info');
            dockerEngineInfo.innerHTML = `
                <div class="engine-stats">
                    <div class="engine-stat">
                        <div class="stat-number">${containers}</div>
                        <div class="stat-label">Total Containers</div>
                    </div>
                    <div class="engine-stat">
                        <div class="stat-number">${running}</div>
                        <div class="stat-label">Running</div>
                    </div>
                    <div class="engine-stat">
                        <div class="stat-number">${stopped}</div>
                        <div class="stat-label">Stopped</div>
                    </div>
                </div>
                <div class="engine-info">
                    <div class="engine-item">
                        <span class="engine-label">Server Version:</span>
                        <span class="engine-value">${serverVersion}</span>
                    </div>
                    <div class="engine-item">
                        <span class="engine-label">Status:</span>
                        <span class="engine-value status-online">Active</span>
                    </div>
                </div>
            `;

            // Update network overview
            const networkOverview = document.getElementById('network-overview');
            try {
                const networks = await cockpit.spawn(['docker', 'network', 'ls', '--format', '{{.Name}}|{{.Driver}}|{{.Scope}}']);
                const networkLines = networks.trim().split('\n').filter(line => line.length > 0);
                
                let networkHtml = '<div class="network-list">';
                networkLines.slice(0, 5).forEach(line => { // Show first 5 networks
                    const [name, driver, scope] = line.split('|');
                    networkHtml += `
                        <div class="network-item">
                            <div class="network-name">
                                <i class="fas fa-network-wired"></i>
                                ${name}
                            </div>
                            <div class="network-details">
                                <span class="network-driver">${driver}</span>
                                <span class="network-scope">${scope}</span>
                            </div>
                        </div>
                    `;
                });
                
                if (networkLines.length > 5) {
                    networkHtml += `<div class="network-more">+${networkLines.length - 5} more networks</div>`;
                }
                
                networkHtml += '</div>';
                networkOverview.innerHTML = networkHtml;
            } catch (error) {
                networkOverview.innerHTML = '<div class="network-error">Unable to load network information</div>';
            }
            
        } catch (error) {
            console.error('Failed to get system info:', error);
            document.getElementById('system-info').innerHTML = '<div class="error">Unable to load system information</div>';
        }
    }



    showSystemLogsModal(logs) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content logs-modal-content';
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        const title = document.createElement('h3');
        title.className = 'modal-title';
        title.textContent = 'System Logs';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.id = 'close-logs-modal';
        closeBtn.textContent = '×';
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        // Safely display logs using textContent to prevent XSS
        const logsContainer = document.createElement('pre');
        logsContainer.className = 'logs-text';
        logsContainer.textContent = logs;
        
        body.appendChild(logsContainer);
        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
        
        document.getElementById('close-logs-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async renderContainers() {
        const content = document.getElementById('main-content');
        
        try {
            const result = await cockpit.spawn(['docker', 'ps', '-a', '--format', '{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}|{{.CreatedAt}}']);
            this.containers = this.parseContainers(result);
            
            const filteredContainers = this.filterItems(this.containers, ['name', 'image', 'status']);
            
            if (filteredContainers.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-cube"></i>
                        <h3>No containers found</h3>
                        <p>No containers match your current filter</p>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <div class="grid-container">
                    ${filteredContainers.map(container => this.renderContainerCard(container)).join('')}
                </div>
            `;

            // Add event listeners for container actions
            this.attachContainerEventListeners();

        } catch (error) {
            console.error('Failed to load containers:', error);
            this.showError('Failed to load containers');
        }
    }

    renderContainerCard(container) {
        const statusClass = container.status.includes('Up') ? 'running' : 'stopped';
        const statusIcon = container.status.includes('Up') ? 'fa-play' : 'fa-stop';
        
        return `
            <div class="card container-card" data-container-id="${container.id}">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-cube"></i>
                        <span>${container.name}</span>
                    </div>
                    <div class="status-badge ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${container.status.split(' ')[0]}
                    </div>
                </div>
                <div class="card-body">
                    <div class="container-info">
                        <div class="info-row">
                            <label>Image:</label>
                            <span>${container.image}</span>
                        </div>
                        <div class="info-row">
                            <label>Status:</label>
                            <span>${container.status}</span>
                        </div>
                        <div class="info-row">
                            <label>Ports:</label>
                            <span>${container.ports || 'None'}</span>
                        </div>
                        <div class="info-row">
                            <label>Created:</label>
                            <span>${container.created}</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="action-buttons">
                        ${container.status.includes('Up') ? 
                            '<button class="btn btn-warning stop-container">Stop</button>' : 
                            '<button class="btn btn-success start-container">Start</button>'
                        }
                        <button class="btn btn-danger remove-container">Remove</button>
                        <button class="btn btn-info logs-container">Logs</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachContainerEventListeners() {
        // Start container buttons
        document.querySelectorAll('.start-container').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = e.target.closest('.container-card');
                const containerId = card.dataset.containerId;
                await this.startContainer(containerId);
            });
        });

        // Stop container buttons
        document.querySelectorAll('.stop-container').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = e.target.closest('.container-card');
                const containerId = card.dataset.containerId;
                await this.stopContainer(containerId);
            });
        });

        // Remove container buttons
        document.querySelectorAll('.remove-container').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = e.target.closest('.container-card');
                const containerId = card.dataset.containerId;
                if (confirm('Are you sure you want to remove this container?')) {
                    await this.removeContainer(containerId);
                }
            });
        });

        // Logs container buttons
        document.querySelectorAll('.logs-container').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = e.target.closest('.container-card');
                const containerId = card.dataset.containerId;
                const containerName = card.querySelector('.card-title span').textContent;
                await this.showContainerLogs(containerId, containerName);
            });
        });
    }

    attachImageEventListeners() {
        // Run image buttons
        document.querySelectorAll('.run-image').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = e.target.closest('.image-card');
                const imageId = card.dataset.imageId;
                const imageName = card.querySelector('.card-title span').textContent;
                let containerName = prompt(`Enter container name for ${imageName}:`, imageName.replace(/[^a-zA-Z0-9_-]/g, '-'));
                
                // Validate container name (must be alphanumeric, dash, or underscore)
                if (containerName && !/^[a-zA-Z0-9_-]+$/.test(containerName)) {
                    this.showError('Invalid container name. Use only alphanumeric characters, dashes, and underscores.');
                    return;
                }
                
                if (containerName) {
                    await this.runImage(imageId, containerName);
                }
            });
        });

        // Remove image buttons
        document.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = e.target.closest('.image-card');
                const imageId = card.dataset.imageId;
                const imageName = card.querySelector('.card-title span').textContent;
                if (confirm(`Are you sure you want to remove the image ${imageName}?`)) {
                    await this.removeImage(imageId);
                }
            });
        });
    }

    async renderImages() {
        const content = document.getElementById('main-content');
        
        try {
            const result = await cockpit.spawn(['docker', 'images', '--format', '{{.Repository}}:{{.Tag}}|{{.ID}}|{{.Size}}|{{.CreatedAt}}']);
            this.images = this.parseImages(result);
            
            const filteredImages = this.filterItems(this.images, ['name', 'id', 'size']);

            content.innerHTML = `
                <div class="grid-container">
                    ${filteredImages.map(image => this.renderImageCard(image)).join('')}
                </div>
            `;

            // Add event listeners for image actions
            this.attachImageEventListeners();

        } catch (error) {
            console.error('Failed to load images:', error);
            this.showError('Failed to load images');
        }
    }

    renderImageCard(image) {
        return `
            <div class="card image-card" data-image-id="${image.id}">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-layer-group"></i>
                        <span>${image.name}</span>
                    </div>
                    <div class="image-size">${image.size}</div>
                </div>
                <div class="card-body">
                    <div class="image-info">
                        <div class="info-row">
                            <label>Image ID:</label>
                            <span>${image.id.substring(0, 12)}...</span>
                        </div>
                        <div class="info-row">
                            <label>Size:</label>
                            <span>${image.size}</span>
                        </div>
                        <div class="info-row">
                            <label>Created:</label>
                            <span>${image.created}</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="action-buttons">
                        <button class="btn btn-primary run-image">Run</button>
                        <button class="btn btn-danger remove-image">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }

    async renderNetworks() {
        const content = document.getElementById('main-content');
        
        try {
            const result = await cockpit.spawn(['docker', 'network', 'ls', '--format', '{{.ID}}|{{.Name}}|{{.Driver}}|{{.Scope}}']);
            this.networks = this.parseNetworks(result);

            content.innerHTML = `
                <div class="grid-container">
                    ${this.networks.map(network => this.renderNetworkCard(network)).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Failed to load networks:', error);
            this.showError('Failed to load networks');
        }
    }

    renderNetworkCard(network) {
        return `
            <div class="card network-card" data-network-id="${network.id}">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-network-wired"></i>
                        <span>${network.name}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="network-info">
                        <div class="info-row">
                            <label>Driver:</label>
                            <span>${network.driver}</span>
                        </div>
                        <div class="info-row">
                            <label>Scope:</label>
                            <span>${network.scope}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderVolumes() {
        const content = document.getElementById('main-content');
        
        try {
            const result = await cockpit.spawn(['docker', 'volume', 'ls', '--format', '{{.Name}}|{{.Driver}}|{{.Mountpoint}}']);
            this.volumes = this.parseVolumes(result);

            content.innerHTML = `
                <div class="grid-container">
                    ${this.volumes.map(volume => this.renderVolumeCard(volume)).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Failed to load volumes:', error);
            this.showError('Failed to load volumes');
        }
    }

    renderVolumeCard(volume) {
        return `
            <div class="card volume-card" data-volume-name="${volume.name}">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-hdd"></i>
                        <span>${volume.name}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="volume-info">
                        <div class="info-row">
                            <label>Driver:</label>
                            <span>${volume.driver}</span>
                        </div>
                        <div class="info-row">
                            <label>Mount Point:</label>
                            <span>${volume.mountpoint}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Parsing functions
    parseContainers(output) {
        if (!output.trim()) return [];
        return output.trim().split('\n').map(line => {
            const [id, name, status, image, ports = '', created = ''] = line.split('|');
            return { id, name, status, image, ports, created };
        });
    }

    parseImages(output) {
        if (!output.trim()) return [];
        return output.trim().split('\n').map(line => {
            const [name, id, size, created = ''] = line.split('|');
            return { name, id, size, created };
        });
    }

    parseNetworks(output) {
        if (!output.trim()) return [];
        return output.trim().split('\n').map(line => {
            const [id, name, driver, scope] = line.split('|');
            return { id, name, driver, scope };
        });
    }

    parseVolumes(output) {
        if (!output.trim()) return [];
        return output.trim().split('\n').map(line => {
            const [name, driver, mountpoint = ''] = line.split('|');
            return { name, driver, mountpoint };
        });
    }

    // Action functions
    async startContainer(containerId) {
        try {
            await cockpit.spawn(['docker', 'start', containerId]);
            this.refreshCurrentView();
        } catch (error) {
            console.error('Failed to start container:', error);
            this.showError('Failed to start container');
        }
    }

    async stopContainer(containerId) {
        try {
            await cockpit.spawn(['docker', 'stop', containerId]);
            this.refreshCurrentView();
        } catch (error) {
            console.error('Failed to stop container:', error);
            this.showError('Failed to stop container');
        }
    }

    async removeContainer(containerId) {
        try {
            await cockpit.spawn(['docker', 'rm', containerId]);
            this.refreshCurrentView();
        } catch (error) {
            console.error('Failed to remove container:', error);
            this.showError('Failed to remove container');
        }
    }

    async showContainerLogs(containerId, containerName) {
        try {
            // Create logs modal if it doesn't exist
            if (!document.getElementById('logs-modal')) {
                this.createLogsModal();
            }

            const modal = document.getElementById('logs-modal');
            const title = document.getElementById('logs-title');
            const content = document.getElementById('logs-content');
            
            title.textContent = `Logs - ${containerName}`;
            content.innerHTML = '<div class="loading">Loading container logs...</div>';
            
            modal.classList.add('active');

            // Get container logs
            const logsResult = await cockpit.spawn(['docker', 'logs', '--tail', '100', containerId]);
            
            // Safely display logs using textContent to prevent XSS
            const logsContainer = document.createElement('pre');
            logsContainer.className = 'logs-text';
            logsContainer.textContent = logsResult;
            content.innerHTML = '';
            content.appendChild(logsContainer);
            
        } catch (error) {
            console.error('Failed to get container logs:', error);
            const content = document.getElementById('logs-content');
            content.innerHTML = '<div class="error">Failed to load container logs</div>';
        }
    }

    createLogsModal() {
        const modalHtml = `
            <div class="modal" id="logs-modal">
                <div class="modal-content logs-modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title" id="logs-title">Container Logs</h3>
                        <button class="modal-close" id="close-logs">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="logs-content"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add event listener for closing modal
        const closeBtn = document.getElementById('close-logs');
        const modal = document.getElementById('logs-modal');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    async runImage(imageId, containerName) {
        try {
            await cockpit.spawn(['docker', 'run', '-d', '--name', containerName, imageId]);
            this.showSuccess(`Container ${containerName} started successfully`);
            // Switch to containers view to see the new container
            this.loadView('containers');
        } catch (error) {
            console.error('Failed to run image:', error);
            this.showError('Failed to run image: ' + error.message);
        }
    }

    async removeImage(imageId) {
        try {
            await cockpit.spawn(['docker', 'rmi', imageId]);
            this.refreshCurrentView();
        } catch (error) {
            console.error('Failed to remove image:', error);
            this.showError('Failed to remove image');
        }
    }

    // Utility functions
    filterItems(items, searchFields) {
        if (!this.searchTerm) return items;
        
        return items.filter(item => {
            return searchFields.some(field => {
                const value = item[field];
                return value && value.toLowerCase().includes(this.searchTerm);
            });
        });
    }

    filterCurrentView() {
        this.renderView(this.currentView);
    }

    refreshCurrentView() {
        this.renderView(this.currentView);
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        if (this.autoRefresh) {
            this.intervalId = setInterval(() => {
                this.refreshCurrentView();
            }, this.refreshInterval);
        }
    }

    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    showError(message) {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showSuccess(message) {
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dockerManager = new DockerManager();
});