# app

## Request flow

### Local development
```mermaid
graph TD
    Vite["Vite server (:8000)"]
    FastAPI["FastAPI/uvicorn (:8080)"]

    Browser --> Vite
    Vite -->|/api/| FastAPI
    Vite -->|/*| Vite
```

### Production
```mermaid
graph TD
    Vite["Vite exported static files"]
    FastAPI["FastAPI/uvicorn"]

    Browser --> FastAPI
    FastAPI -->|index.html and /assets/| Vite
```
