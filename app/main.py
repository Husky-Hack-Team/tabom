from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="tabom")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

items: list[dict] = []


class Item(BaseModel):
    name: str


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"healthy": True}


@app.get("/hello/{name}")
def hello(name: str):
    return {"message": f"Olá, {name}!"}


@app.get("/items")
def list_items():
    return items


@app.post("/items", status_code=201)
def create_item(item: Item):
    new = {"id": len(items) + 1, **item.model_dump()}
    items.append(new)
    return new


@app.get("/items/{item_id}")
def get_item(item_id: int):
    for item in items:
        if item["id"] == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item não encontrado")
