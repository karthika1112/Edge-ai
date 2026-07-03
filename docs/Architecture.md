# EdgeShield AI - Architecture

## Frontend
- React 19 + Vite
- Tailwind CSS for styling
- Framer Motion for animations
- Context API for state management

## Backend
- FastAPI (Python) for API endpoints and AI integrations
- Node.js for WebSocket and Telemetry services
- Custom protocols (Modbus, MQTT, OPCUA)

## Data Flow
- Clients interact with React UI.
- React UI communicates with FastAPI for static endpoints and authentication.
- Real-time telemetry is streamed via Node.js WebSockets to the UI.
