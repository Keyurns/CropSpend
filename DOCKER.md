# Docker Deployment Guide

## Prerequisites

- **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop/))
- **server/.env** configured (see below)

## 1. Environment Variables

Ensure `server/.env` exists with these values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/expense-tracker
JWT_SECRET=your-secret-key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Notes:**
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Any secure random string
- `EMAIL_USER/EMAIL_PASS`: Gmail with App Password for email reports (optional - demo mode works without it)

If you get `querySrv ECONNREFUSED` errors in Docker, add a direct connection string:
```env
MONGODB_URI_DIRECT=mongodb://USER:PASS@cluster0-shard-00-00.xxxxx.mongodb.net:27017,...
```

## 2. Build the Docker Image

From the project root (where `Dockerfile` is):

```bash
docker-compose build
```

This builds:
1. **Frontend**: React app compiled to static files
2. **Backend**: Node.js Express API
3. **Final image**: Single container serving both UI and API on port 5000

To rebuild without cache:
```bash
docker-compose build --no-cache
```

## 3. Run the Container

Start the container:
```bash
docker-compose up
```

Run in background (detached):
```bash
docker-compose up -d
```

## 4. Access the App

- **Web App**: http://localhost:5000
- **API**: http://localhost:5000/api/...

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start container |
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop and remove container |
| `docker-compose logs -f` | Stream logs |
| `docker-compose ps` | List running containers |
| `docker-compose build --no-cache` | Rebuild from scratch |

## Architecture

```
┌─────────────────────────────────────────┐
│           Docker Container              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     Node.js Server (port 5000)  │   │
│  │                                 │   │
│  │  /api/*  → Express API routes   │   │
│  │  /*      → React static files   │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
         │
         ▼
    MongoDB Atlas (cloud)
```

## Troubleshooting

**Container won't start:**
- Check logs: `docker-compose logs`
- Verify `.env` file exists in `server/`

**MongoDB connection fails:**
- Ensure your IP is whitelisted in MongoDB Atlas (Network Access → Add Current IP)
- Try adding `MONGODB_URI_DIRECT` for DNS issues in Docker

**Email not working:**
- Set up Gmail App Password (see main README)
- Demo mode with Ethereal works without credentials

**Frontend shows blank page:**
- Rebuild: `docker-compose build --no-cache`
- Check build output in logs
