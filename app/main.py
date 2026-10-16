from fastapi import FastAPI

app = FastAPI(title="tabom")


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"healthy": True}
