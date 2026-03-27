-- Migration 001: Extensions
-- PetauLife+ MVP

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vector embeddings for RAG
CREATE EXTENSION IF NOT EXISTS "vector";

-- Crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
