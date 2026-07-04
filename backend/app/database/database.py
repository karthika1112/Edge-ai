import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Render mounts persistent volumes at /data. We check if /data is present and writable.
# If so, we store the database there to ensure users persist across redeploys.
if os.path.exists("/data") and os.access("/data", os.W_OK):
    SQLALCHEMY_DATABASE_URL = "sqlite:////data/edgeshield.db"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./edgeshield.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
