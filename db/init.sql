-- Sample database initialization script
-- This runs automatically when the PostgreSQL container starts for the first time

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO users (email, name) VALUES 
    ('alice@example.com', 'Alice Johnson'),
    ('bob@example.com', 'Bob Smith');

INSERT INTO posts (user_id, title, content) VALUES 
    (1, 'Hello World', 'This is my first post!'),
    (2, 'Getting Started', 'Welcome to the platform.');
