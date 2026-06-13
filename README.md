# Smart Pond XAI — React Frontend

## Quick Start

```bash
# 1. zip extract করে frontend-react ফোল্ডারে যাও
cd frontend-react

# 2. dependencies install করো
npm install

# 3. dev server চালাও
npm run dev
# → http://localhost:5173 এ খুলবে

# 4. production build
npm run build
```

## File Structure

```
frontend-react/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx              ← entry point
    ├── App.jsx               ← routes
    ├── index.css             ← global styles
    ├── services/
    │   └── api.js            ← backend API calls
    ├── components/
    │   ├── Layout.jsx        ← sidebar + main wrapper
    │   ├── DataTable.jsx     ← sortable paginated table
    │   ├── PageHeader.jsx    ← page title + controls
    │   ├── TabBar.jsx        ← tab navigation
    │   └── SearchBar.jsx     ← search + time filter
    └── pages/
        ├── Dashboard.jsx          ← KPI cards + charts
        ├── Analytics.jsx          ← trend charts
        ├── XAIPredictions.jsx     ← feature importance + XAI log
        ├── FishFeeding.jsx        ← feeding log + charts
        ├── AlertsLogs.jsx         ← alerts with filter
        ├── DatabaseExplorer.jsx   ← 7-tab data explorer
        └── Settings.jsx           ← config UI
```

## Backend API

`src/services/api.js` এ BASE URL:
```
https://pond-management-backend.onrender.com/api
```

Endpoints used:
- `GET /dashboard`
- `GET /history?hours=24`
- `GET /weather?hours=24`
- `GET /predictions?hours=24`
- `GET /alerts?hours=24`
- `GET /xai?hours=24`
- `GET /feeding?hours=24`
- `GET /fish-habitat?hours=24`

## Pages

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/analytics` | Analytics |
| `/xai-predictions` | XAI Predictions |
| `/fish-feeding` | Fish Feeding |
| `/alerts` | Alerts Logs |
| `/database` | Database Explorer |
| `/settings` | Settings |
