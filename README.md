# SurfaceFlow AI System

A modular automation platform for construction project management, featuring AI-powered hotel booking integration with BuilderTrend.

## 🏗️ Architecture

The system consists of three main components:

```
SurfaceFlow AI System/
├── backend/          # Django REST API
├── portal/           # Next.js Frontend Dashboard
└── extension/        # Chrome Extension for BuilderTrend
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn
- Google Chrome (for extension)

---

## 1. Backend Setup (Django)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver 0.0.0.0:8000
```

The backend API will be available at `http://localhost:8000`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health/` | GET | Health check |
| `/api/v1/modules/` | GET | List automation modules |
| `/api/v1/buildertrend/hotel-booking/search/` | POST | Search hotels |

---

## 2. Frontend Portal Setup (Next.js)

```bash
# Navigate to frontend directory
cd portal/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The portal will be available at `http://localhost:3000`

---

## 3. Chrome Extension Setup

### Development Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project

### Usage

1. Navigate to a BuilderTrend job page
2. Click the **"Book Hotel with AI"** button (teal button near tabs)
3. Configure booking parameters in the modal
4. Select a hotel from search results
5. Confirm booking - it syncs automatically with BuilderTrend

---

## 🛠️ Development

### Running All Services

Open three terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd portal/frontend && npm run dev
```

**Terminal 3 - Extension:**
- Load unpacked extension in Chrome
- Refresh after making changes

### Environment Variables

Create `.env` files in respective directories:

**backend/.env:**
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
```

**portal/frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📁 Project Structure

### Backend (`/backend`)
```
backend/
├── api/                 # REST API configuration
├── automations/         # Automation modules
├── buildertrend/        # BuilderTrend integration
├── surfaceflow/         # Django project settings
└── manage.py
```

### Frontend (`/portal/frontend`)
```
portal/frontend/
├── app/                 # Next.js App Router pages
├── components/          # React components
└── public/              # Static assets
```

### Extension (`/extension`)
```
extension/
├── manifest.json        # Extension configuration
├── popup/               # Extension popup UI
├── content/             # Content scripts (injected into pages)
│   ├── ui.js            # UI injection logic
│   └── styles.css       # Injected styles
└── background/          # Service worker
```

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Django 5.0, Django REST Framework |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Extension | Chrome Manifest V3, Vanilla JS |
| Database | SQLite (dev), PostgreSQL (prod) |
| Task Queue | Celery + Redis |

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
