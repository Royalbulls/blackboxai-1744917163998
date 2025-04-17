#!/bin/bash

# Kill any process using port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start the Python server
python3 server.py
