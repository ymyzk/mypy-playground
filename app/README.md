# app

## Request flow

### Local development
```mermaid
graph TD
    Vite["Vite server (:8000)"]
    Tornado["Tornado server (:8080)"]

    Browser --> Vite
    Vite -->|/api/| Tornado
    Vite -->|/*| Vite
```

### Production
```mermaid
graph TD
    Vite["Vite exported static files"]
    Tornado["Tornado server"]

    Browser --> Tornado
    Tornado -->|index.html and /assets/| Vite
```
