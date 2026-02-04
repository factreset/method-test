#!/bin/bash
# Configure method-test for git-based auto-deploy

cd /Users/delonodonnell/Documents/code/methodlab/relay

python3 << 'PYTHON_SCRIPT'
import sys
sys.path.insert(0, 'src')
from relay.api import client

c = client.Client('http://127.0.0.1:8000', '/Users/delonodonnell/.relay/key')

# Configure project with git source
result = c.post('/v1/projects', {
    'id': 'method-test',
    'source': {
        'type': 'git',
        'repo': 'git@github.com:factreset/method-test.git',
        'branch': 'main'
    },
    'poll': True
})

import json
print("Project configuration result:")
print(json.dumps(result, indent=2))

# Verify configuration
print("\nCurrent projects:")
projects = c.get('/v1/projects')
print(json.dumps(projects, indent=2))

# Check deploys
print("\nCurrent deploys:")
deploys = c.get('/v1/deploys')
print(json.dumps(deploys, indent=2))
PYTHON_SCRIPT
